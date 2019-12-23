import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../../../integration/crud-mongoose/users';
import { MongooseCrudService } from '../../../crud-mongoose/src/mongoose-crud.service';

@Injectable()
export class UsersService extends MongooseCrudService<User> {
  constructor(@InjectModel('User') model) {
    super(model);
  }
}
