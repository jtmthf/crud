import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
  JoinOptions,
  QueryOptions,
} from '@nestjsx/crud';
import {
  ComparisonOperator,
  ParsedRequestParams,
  QueryFilter,
  QueryJoin,
  QuerySort,
  SCondition,
  SConditionKey,
} from '@nestjsx/crud-request';
import {
  hasLength,
  isArrayFull,
  isNil,
  isNull,
  isObject,
  isUndefined,
  objKeys,
} from '@nestjsx/util';
import { Document, DocumentQuery, Model, QueryPopulateOptions, Schema } from 'mongoose';
import { brackets } from './brackets';

import escapeStringRegexp = require('escape-string-regexp');

export class MongooseCrudService<T extends Document> extends CrudService<T> {
  private documentFields: string[] = [];
  private documentRefs: any[] = [];

  constructor(protected model: Model<T>) {
    super();

    this.onInitMapDocumentFields();
  }

  public get findOne(): Model<T>['findOne'] {
    return this.model.findOne.bind(this.model);
  }

  public get find(): Model<T>['find'] {
    return this.model.find.bind(this.model);
  }

  public get count(): Model<T>['countDocuments'] {
    return this.model.countDocuments.bind(this.model);
  }

  private get schema(): Schema<T> {
    return this.model.schema;
  }

  private get modelName(): string {
    return this.model.modelName;
  }

  /**
   * Get many
   * @param req
   */
  public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    const { parsed, options } = req;
    const query = this.createQuery(parsed, options);

    if (this.decidePagination(parsed, options)) {
      const { limit, skip } = query.getOptions();
      const data = await query.exec();
      let total = data.length + skip;
      if (total === limit + skip) {
        total = await this.createQuery(parsed, options)
          .limit(undefined)
          .countDocuments();
      }

      return this.createPageInfo(data, total, limit, skip);
    }

    return query.exec();
  }

  /**
   * Get one
   * @param req
   */
  public async getOne(req: CrudRequest): Promise<T> {
    return this.getOneOrFail(req);
  }

  /**
   * Create one
   * @param req
   * @param dto
   */
  public async createOne(req: CrudRequest, dto: T): Promise<T> {
    const document = this.prepareDocumentBeforeSave(dto, req.parsed.paramsFilter);

    if (!document) {
      throw this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    return document.save();
  }

  /**
   * Create many
   * @param req
   * @param dto
   */
  public async createMany(req: CrudRequest, dto: CreateManyDto<T>): Promise<T[]> {
    if (!isObject(dto) || !isArrayFull(dto.bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const bulk = dto.bulk
      .map((one) => this.prepareDocumentBeforeSave(one, req.parsed.paramsFilter))
      .filter((d) => !isUndefined(d));

    if (!hasLength(bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    return this.model.insertMany(bulk);
  }

  /**
   * Update one
   * @param req
   * @param dto
   */
  public async updateOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
    const paramsFilters = this.getParamsFilters(req.parsed);

    const toSave = !allowParamsOverride ? { ...dto, ...paramsFilters } : dto;
    const updated = await this.model.updateOne(paramsFilters, toSave, { upsert: true });

    if (returnShallow) {
      return updated;
    } else {
      req.parsed.paramsFilter.forEach((filter) => {
        filter.value = updated[filter.field];
      });
      return this.getOneOrFail(req);
    }
  }

  /**
   * Replace one
   * @param req
   * @param dto
   */
  public async replaceOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
    const paramsFilters = this.getParamsFilters(req.parsed);

    const toSave = !allowParamsOverride
      ? { ...dto, ...paramsFilters }
      : { ...paramsFilters, ...dto };
    const replaced = await this.model.replaceOne(paramsFilters, toSave);

    if (returnShallow) {
      return replaced;
    } else {
      req.parsed.paramsFilter.forEach((filter) => {
        filter.value = replaced[filter.field];
      });
      return this.getOneOrFail(req);
    }
  }

  /**
   * Delete one
   * @param req
   */
  public async deleteOne(req: CrudRequest): Promise<void | T> {
    const { returnDeleted } = req.options.routes.deleteOneBase;
    const paramsFilters = this.getParamsFilters(req.parsed);

    return returnDeleted
      ? { ...this.model.findOneAndDelete(paramsFilters), ...paramsFilters }
      : undefined;
  }

  public getParamsFilters(parsed: CrudRequest['parsed']): object {
    const paramsFilters = {};

    /* istanbul ignore else */
    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        paramsFilters[filter.field] = filter.value;
      }
    }

    return paramsFilters;
  }

  public decidePagination(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): boolean {
    return (
      (Number.isFinite(parsed.page) || Number.isFinite(parsed.offset)) &&
      !!this.getLimit(parsed, options.query)
    );
  }

  public createQuery(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
    many = true,
  ): DocumentQuery<T[], T> & {} {
    // create query
    const query = this.model.find();

    const queryPopulateOptions: QueryPopulateOptions[] = [];

    // get select fields;
    const select = this.getSelect(parsed, options.query!);

    // select fields;
    query.select(select.join(' '));

    // legacy filter and or params
    // will be deprecated in the next major release
    if (isNil(parsed.search)) {
      const defaultSearch = this.getDefaultSearchCondition(options, parsed);
      this.setSearchCondition(query, { $and: defaultSearch });
    }

    const filters = [...parsed.paramsFilter, ...parsed.filter];
    const hasFilter = isArrayFull(filters);
    const hasOr = isArrayFull(parsed.or);

    if (hasFilter && hasOr) {
      if (filters.length === 1 && parsed.or.length === 1) {
        // WHERE :filter OR :or
        this.setOrWhere(filters[0], query);
        this.setOrWhere(parsed.or[0], query);
      } else if (filters.length === 1) {
        this.setAndWhere(filters[0], query);
        query.or(
          parsed.or.map((cond) => ({
            [cond.field]: this.mapOperatorsToQuery(cond),
          })),
        );
      } else if (parsed.or.length === 1) {
        this.setOrWhere(parsed.or[0], query);
        query.or(
          filters.map((cond) => ({
            [cond.field]: this.mapOperatorsToQuery(cond),
          })),
        );
      } else {
        query.and(
          filters.map((cond) => ({
            [cond.field]: this.mapOperatorsToQuery(cond),
          })),
        );
        query.or(
          parsed.or.map((cond) => ({
            [cond.field]: this.mapOperatorsToQuery(cond),
          })),
        );
      }
    } else if (hasOr) {
      // WHERE :or OR :or OR ...
      parsed.or.forEach((filter) => {
        this.setOrWhere(filter, query);
      });
    } else if (hasFilter) {
      // WHERE :filter AND :filter AND ...
      filters.forEach((filter) => {
        this.setAndWhere(filter, query);
      });
    }

    // set joins
    const populateOptions = options.query!.join || {};
    const allowedPopulates = objKeys(populateOptions);

    if (hasLength(allowedPopulates)) {
      const eagerPopulates = new Map<string, boolean>();

      allowedPopulates.forEach((allowedPopulate) => {
        if (populateOptions[allowedPopulate].eager) {
          const cond = parsed.join.find((j) => j && j.field === allowedPopulate) || {
            field: allowedPopulate,
          };
          this.setPopulate(cond, populateOptions, query);
          eagerPopulates.set(allowedPopulate, true);
        }
      });

      if (isArrayFull(parsed.join)) {
        parsed.join.forEach((populate) => {
          if (!eagerPopulates.get(populate.field)) {
            this.setPopulate(populate, populateOptions, query);
          }
        });
      }
    }

    /* istanbul ignore else */
    if (many) {
      // set sort
      const sort = this.getSort(parsed, options.query);
      query.sort(sort);

      // set limit
      const limit = this.getLimit(parsed, options.query);
      /* istanbul ignore else */
      if (isFinite(limit)) {
        query.limit(limit);
      }

      // set skip
      const skip = this.getSkip(parsed, limit);
      /* istanbul ignore else */
      if (isFinite(skip)) {
        query.skip(skip);
      }
    }

    return query;
  }

  private getDefaultSearchCondition(
    options: CrudRequestOptions,
    parsed: ParsedRequestParams,
  ): any[] {
    const filter = this.queryFilterToSearch(options.query.filter as QueryFilter[]);
    const paramsFilter = this.queryFilterToSearch(parsed.paramsFilter);

    return [...filter, ...paramsFilter];
  }

  private queryFilterToSearch(filter: QueryFilter[]): any {
    return isArrayFull(filter)
      ? filter.map((item) => ({
          [item.field]: { [item.operator]: item.value },
        }))
      : isObject(filter)
      ? [filter]
      : [];
  }

  private onInitMapDocumentFields() {
    this.model.schema.eachPath((path, schemaType) => {
      this.documentFields.push(path);
    });
  }

  private async getOneOrFail(req: CrudRequest): Promise<T> {
    const { parsed, options } = req;
    const query = this.createQuery(parsed, options);
    const found = await query.findOne();

    if (!found) {
      this.throwNotFoundException(this.modelName);
    }

    return found;
  }

  private prepareDocumentBeforeSave(dto: T, paramsFilter: QueryFilter[]): T | undefined {
    if (!isObject(dto)) {
      return undefined;
    }

    if (hasLength(paramsFilter)) {
      paramsFilter.forEach((filter) => {
        dto[filter.field as keyof T] = filter.value;
      });
    }

    if (!hasLength(objKeys(dto))) {
      return undefined;
    }

    return dto instanceof this.model ? dto : new this.model(dto as any);
  }

  private getAllowedFields(fields: string[], options: QueryOptions): string[] {
    return (!options.exclude || !options.exclude.length) &&
      (!options.allow || !options.allow.length)
      ? fields
      : fields.filter(
          (field) =>
            (options.exclude && options.exclude.length
              ? !options.exclude.some((f) => f === field)
              : true) &&
            (options.allow && options.allow.length
              ? options.allow.some((f) => f === field)
              : true),
        );
  }

  private setPopulate(
    cond: QueryJoin,
    populateOptions: JoinOptions,
    query: DocumentQuery<T[], T> & {},
  ) {
    if (
      cond.field &&
      this.documentRefs.includes(cond.field) &&
      populateOptions[cond.field]
    ) {
      query.populate({
        path: cond.field,
      });
    }
  }

  private setAndWhere(cond: QueryFilter, query: DocumentQuery<T[], T> & {}) {
    const expression = this.mapOperatorsToQuery(cond);
    query.where({ [cond.field]: expression });
  }

  private setOrWhere(cond: QueryFilter, query: DocumentQuery<T[], T> & {}) {
    const expression = this.mapOperatorsToQuery(cond);
    query.where({ [cond.field]: { $or: expression } });
  }

  private setSearchCondition(
    query: Pick<DocumentQuery<T[], T> & {}, 'and' | 'or'>,
    search: SCondition,
    condition: SConditionKey = '$and',
  ) {
    /* istanbul ignore else */
    if (isObject(search)) {
      const keys = objKeys(search);
      /* istanbul ignore else */
      if (keys.length) {
        // search: {$and: [...], ...}
        if (isArrayFull(search.$and)) {
          // search: {$and: [{}]}
          if (search.$and.length === 1) {
            this.setSearchCondition(query, search.$and[0], condition);
          }
          // search: {$and: [{}, {}, ...]}
          else {
            this.queryAddBrackets(
              query,
              condition,
              brackets((qb) => {
                search.$and.forEach((item) => {
                  this.setSearchCondition(qb, item, '$and');
                });
              }),
            );
          }
        }
        // search: {$or: [...], ...}
        else if (isArrayFull(search.$or)) {
          // search: {$or: [...]}
          if (keys.length === 1) {
            // search: {$or: [{}]}
            if (search.$or.length === 1) {
              this.setSearchCondition(query, search.$or[0], condition);
            }
            // search: {$or: [{}, {}, ...]}
            else {
              this.queryAddBrackets(
                query,
                condition,
                brackets((qb) => {
                  search.$or.forEach((item) => {
                    this.setSearchCondition(qb, item, '$or');
                  });
                }),
              );
            }
          }
          // search: {$or: [...], foo, ...}
          else {
            this.queryAddBrackets(
              query,
              condition,
              brackets((qb) => {
                keys.forEach((field) => {
                  if (field !== '$or') {
                    const value = search[field];
                    if (!isObject(value)) {
                      this.querySetWhere(qb, '$and', field, value);
                    } else {
                      this.setSearchFieldObjectCondition(qb, '$and', field, value);
                    }
                  } else {
                    if (search.$or.length === 1) {
                      this.setSearchCondition(query, search.$or[0], '$and');
                    } else {
                      this.queryAddBrackets(
                        qb,
                        '$and',
                        brackets((qb2) => {
                          search.$or.forEach((item) => {
                            this.setSearchCondition(qb2, item, '$or');
                          });
                        }),
                      );
                    }
                  }
                });
              }),
            );
          }
        }
        // search: {...}
        else {
          // search: {foo}
          if (keys.length === 1) {
            const field = keys[0];
            const value = search[field];
            if (!isObject(value)) {
              this.querySetWhere(query, condition, field, value);
            } else {
              this.setSearchFieldObjectCondition(query, condition, field, value);
            }
          }
          // search: {foo, ...}
          else {
            this.queryAddBrackets(
              query,
              condition,
              brackets((qb) => {
                keys.forEach((field) => {
                  const value = search[field];
                  if (!isObject(value)) {
                    this.querySetWhere(qb, '$and', field, value);
                  } else {
                    this.setSearchFieldObjectCondition(qb, '$and', field, value);
                  }
                });
              }),
            );
          }
        }
      }
    }
  }

  private queryAddBrackets(
    query: Pick<DocumentQuery<T[], T> & {}, 'and' | 'or'>,
    condition: SConditionKey,
    params: object[],
  ) {
    if (condition === '$and') {
      query.and(params);
    } else {
      query.or(params);
    }
  }

  private querySetWhere(
    query: Pick<DocumentQuery<T[], T> & {}, 'and' | 'or'>,
    condition: SConditionKey,
    field: string,
    value: any,
    operator: ComparisonOperator = '$eq',
  ) {
    const args = [
      { field, operator: isNull(value) ? '$isnull' : operator, value },
      query,
    ];
    const fn = condition === '$and' ? this.setAndWhere : this.setOrWhere;
    fn.apply(this, args);
  }

  private setSearchFieldObjectCondition(
    query: Pick<DocumentQuery<T[], T> & {}, 'and' | 'or'>,
    condition: SConditionKey,
    field: string,
    object: any,
  ) {
    /* istanbul ignore else */
    if (isObject(object)) {
      const operators = objKeys(object);

      if (operators.length === 1) {
        const operator = operators[0] as ComparisonOperator;
        const value = object[operator];

        if (isObject(object.$or)) {
          const orKeys = objKeys(object.$or);
          this.setSearchFieldObjectCondition(
            query,
            orKeys.length === 1 ? condition : '$or',
            field,
            object.$or,
          );
        } else {
          this.querySetWhere(query, condition, field, value, operator);
        }
      } else {
        /* istanbul ignore else */
        if (operators.length > 1) {
          this.queryAddBrackets(
            query,
            condition,
            brackets((qb) => {
              operators.forEach((operator: ComparisonOperator) => {
                const value = object[operator];

                if (operator !== '$or') {
                  this.querySetWhere(qb, condition, field, value, operator);
                } else {
                  const orKeys = objKeys(object.$or);

                  if (orKeys.length === 1) {
                    this.setSearchFieldObjectCondition(qb, condition, field, object.$or);
                  } else {
                    this.queryAddBrackets(
                      qb,
                      condition,
                      brackets((qb2) => {
                        this.setSearchFieldObjectCondition(qb2, '$or', field, object.$or);
                      }),
                    );
                  }
                }
              });
            }),
          );
        }
      }
    }
  }

  private getSelect(query: ParsedRequestParams, options: QueryOptions): string[] {
    const allowed = this.getAllowedFields(this.documentFields, options);

    const fields =
      query.fields && query.fields.length
        ? query.fields.filter((field) => allowed.some((f) => field === f))
        : allowed;

    return [
      ...(options.persist && options.persist.length ? options.persist : []),
      ...fields,
      options.exclude && options.exclude.includes('_id') ? '-_id' : '_id',
    ];
  }

  private getSkip(query: ParsedRequestParams, limit: number): number | null {
    return query.page && limit
      ? limit * (query.page - 1)
      : query.offset
      ? query.offset
      : null;
  }

  private getLimit(query: ParsedRequestParams, options: QueryOptions): number | null {
    if (query.limit) {
      return options.maxLimit
        ? query.limit <= options.maxLimit
          ? query.limit
          : options.maxLimit
        : query.limit;
    }
    /* istanbul ignore if */
    if (options.limit) {
      return options.maxLimit
        ? options.limit <= options.maxLimit
          ? options.limit
          : options.maxLimit
        : options.limit;
    }

    return options.maxLimit ? options.maxLimit : null;
  }

  private getSort(query: ParsedRequestParams, options: QueryOptions) {
    return query.sort && query.sort.length
      ? this.mapSort(query.sort)
      : options.sort && options.sort.length
      ? this.mapSort(options.sort)
      : {};
  }

  private mapSort(sort: QuerySort[]) {
    const params: object = {};

    for (let i = 0; i < sort.length; i++) {
      params[sort[i].field] = sort[i].order;
    }

    return params;
  }

  private mapOperatorsToQuery(cond: QueryFilter) {
    switch (cond.operator) {
      case 'eq':
        return cond.value;
      case 'ne':
        return { $ne: cond.value };
      case 'gt':
        return { $gt: cond.value };
      case 'lt':
        return { $lt: cond.value };
      case 'gte':
        return { $gte: cond.value };
      case 'lte':
        return { $lte: cond.value };
      case 'starts':
        return new RegExp(`^${escapeStringRegexp(cond.value)}`);
      case 'ends':
        return new RegExp(`${escapeStringRegexp(cond.value)}$`);
      case 'cont':
        return new RegExp(escapeStringRegexp(cond.value));
      case 'excl':
        return { $not: new RegExp(escapeStringRegexp(cond.value)) };
      case 'in':
        if (!Array.isArray(cond.value) || !cond.value.length) {
          this.throwBadRequestException(`Invalid field '${cond.field}' value`);
        }
        return { $in: cond.value };
      case 'notin':
        if (!Array.isArray(cond.value) || !cond.value.length) {
          this.throwBadRequestException(`Invalid field '${cond.field}' value`);
        }
        return { $nin: cond.value };
      case 'isnull':
        return null;
      case 'notnull':
        return { $not: null };
      case 'between':
        if (!Array.isArray(cond.value) || !cond.value.length || cond.value.length !== 2) {
          this.throwBadRequestException(`Invalid field '${cond.field}' value`);
        }
        return {
          $gte: cond.value[0],
          $lt: cond.value[1],
        };
      default:
        return cond.value;
    }
  }
}
