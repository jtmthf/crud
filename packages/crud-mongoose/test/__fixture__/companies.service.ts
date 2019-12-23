import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from '../../../../integration/crud-mongoose/companies';
import { MongooseCrudService } from '../../../crud-mongoose/src/mongoose-crud.service';

@Injectable()
export class CompaniesService extends MongooseCrudService<Company> {
  constructor(@InjectModel('Company') model) {
    super(model);
  }
}
