## [4.3.0] - 2019-12-21

### Features

- **crud** added `dto` to the `CrudOptions` ([#132](https://github.com/nestjsx/crud/issues/132))
- **crud** added `serialize` to the `CrudOptions`
- **crud** added `search` query param and a new search condition api
- **crud** added new condition operators: `$eqL`, `$neL`, `$startsL`, `$endsL`, `$contL`, `$exclL`, `$inL`, `$notinL` for case insensitive queries ([#77](https://github.com/nestjsx/crud/issues/77))
- **crud** added `@crudAuth()` class decorator for authorized requests

### Improvements

- **crud** `CrudRequestInterceptor` can be used for both crud and non-crud controllers or for custom routes within crud controller
- **crud** support `@nestjs/swagger` major versions: v3 and v4 ([#340](https://github.com/nestjsx/crud/issues/340))
- **crud** added `returnShallow` option to the `CrudOptions.routes` `createOneBase`, `updateOneBase`, `replaceOneBase` methods ([#158](https://github.com/nestjsx/crud/issues/158))
- **crud** added `alias` to the `CrudOptions.join` ([#350](https://github.com/nestjsx/crud/issues/55))
- **crud** added `alwaysPaginate` to the `CrudOptions.query`, can be used globally as well ([#213](https://github.com/nestjsx/crud/issues/213))
- **crud** `CrudOptions.query.filter` can be a function that returns transformed `search` object
- **crud** added `disabled` for an objects withing `CrudOptions.params`
- **request** query builder: now uses [qs](https://www.npmjs.com/package/qs) package
- **request** query builder: `filter` and `or` methods can accept array of filter objects
- **typeorm** changed visibility of all methods ([#226](https://github.com/nestjsx/crud/issues/226))
- **typeorm** use `ILIKE` for PostgreSQL ([#212](https://github.com/nestjsx/crud/issues/212))

### Bug Fixes

- **crud** swagger: fixed response models ([#350](https://github.com/nestjsx/crud/issues/350))
- **crud** swagger: fixed query params ([#196](https://github.com/nestjsx/crud/issues/196))
- **crud** swagger: fixed renamed params ([#283](https://github.com/nestjsx/crud/issues/283))
- **crud** swagger: fixed swagger method decoration on overridden methods
- **crud** query parser: fixed parsing integers when it's a big int
- **typeorm** fixed load embedded entities ([#138](https://github.com/nestjsx/crud/issues/138))
- **typeorm** fixed left join issues ([#31](https://github.com/nestjsx/crud/issues/31), [#98](https://github.com/nestjsx/crud/issues/98))
- **typeorm** fixed composite key joins ([#238](https://github.com/nestjsx/crud/issues/238))
- **typeorm** fixed entity events ([#51](https://github.com/nestjsx/crud/issues/51))
- **typeorm** all methods return entity instances ([#259](https://github.com/nestjsx/crud/issues/259))

## [4.2.0] - 2019-07-26

### Features

- **crud** added support for older versions of `UUID` ([#186])

### Bug Fixes

- **crud** fixed `BulkDto` swagger description ([#159])
- **crud** fixed `CrudRequestInterceptor` request parsing
- **requests** added `@nestjsx/util` as a dependency ([#184])
- **requests** fixed condition operators mapping ([#148])
- **requests** fixed ISO date string validation ([#161])
- **typeorm** fixed filtering and sorting by nested fields ([#105])
- **typeorm** fixed `too many nested levels` exception ([#87])
- **typeorm** fixed pagination `pageCount` ([#179])

### Deps

- **dev** updated deps

## [4.1.0] - 2019-06-27

### Features

- **crud** added `PUT` request handling ([#107])
- **requests** added creating request builder with params ([#131])
- **requests** improved query params naming parsing ([#101])

### Bug Fixes

- **crud** set decorators after Swagger so metadata can be overwritten
- **requests** added support for ISO-8610 date strings

## [4.0.1] - 2019-06-21

### Bug Fixes

- **requests** fixed query parser to properly accept numbers and booleans ([#97])

## [4.0.0] - 2019-06-12

### BREAKING CHANGES

- **crud:** changed `CrudOptions` ([docs](https://github.com/nestjsx/crud/wiki/Controllers#options))
- **crud:** remove decorators: `@ParsedOptions`, `@ParsedParams`, `@ParsedQuery`. Add decorator `@ParsedRequest` instead.
- **crud:** change interfaces
- **services:** remove `RestfulOptions` from services
- **services:** changed base abstract class

### Features

- **repo:** refactor to monorepository
- **docs:** new [documentation](https://github.com/nestjsx/crud/wiki)
- **packages:** totally refactor `@nestjsx/crud` to be service (ORM) agnostic
- **packages:** add `@nestjsx/crud-typeorm` ([docs](https://github.com/nestjsx/crud/wiki/ServiceTypeorm))
- **packages:** add `@nestjsx/crud-request` ([docs](https://github.com/nestjsx/crud/wiki/Requests#description), [#53])
- **crud:** add global options ([docs](https://github.com/nestjsx/crud/wiki/Controllers#global-options), [#64])
- **crud:** add eager relations option ([#54], [#67])

### Bug Fixes

- several fixes

[4.3.0]: https://github.com/nestjsx/crud/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/nestjsx/crud/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/nestjsx/crud/compare/v4.0.1...v4.1.0
[4.0.1]: https://github.com/nestjsx/crud/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/nestjsx/crud/compare/v.3.2.0...v4.0.0
[#97]: https://github.com/nestjsx/crud/issues/97
[#53]: https://github.com/nestjsx/crud/issues/53
[#64]: https://github.com/nestjsx/crud/issues/64
[#54]: https://github.com/nestjsx/crud/issues/54
[#67]: https://github.com/nestjsx/crud/issues/67
[#107]: https://github.com/nestjsx/crud/issues/107
[#131]: https://github.com/nestjsx/crud/issues/131
[#101]: https://github.com/nestjsx/crud/issues/101
[#186]: https://github.com/nestjsx/crud/pull/186
[#184]: https://github.com/nestjsx/crud/issues/184
[#148]: https://github.com/nestjsx/crud/issues/148
[#105]: https://github.com/nestjsx/crud/issues/105
[#87]: https://github.com/nestjsx/crud/issues/87
[#159]: https://github.com/nestjsx/crud/issues/159
[#161]: https://github.com/nestjsx/crud/issues/161
[#179]: https://github.com/nestjsx/crud/issues/179
