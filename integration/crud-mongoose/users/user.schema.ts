import { CrudValidationGroups } from '@nestjsx/crud';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Document, Schema } from 'mongoose';
import { Company } from '../companies';

const { CREATE, UPDATE } = CrudValidationGroups;

export interface User extends Document {
  _id: number;
  email: string;
  isActive: boolean;
  name: {
    first?: string;
    last?: string;
  };
  profileId?: number;
  companyId?: number;
  company?: Company;
}

export class NameDto {
  @IsString({ always: true })
  first: string;

  @IsString({ always: true })
  last: string;
}

// tslint:disable-next-line: max-classes-per-file
export class UserDto {
  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @IsEmail({ require_tld: false }, { always: true })
  email: string;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsBoolean({ always: true })
  isActive: boolean;

  @Type((t) => NameDto)
  name: NameDto;

  profileId?: number;

  companyId?: number;

  /**
   * Relations
   */

  company?: Company;
}

let id = 1000;

export const UserSchema = new Schema({
  _id: { type: Number, default: () => id++ },
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  name: {
    first: String,
    last: String,
  },
  profileId: Number,
  companyId: Number,
  company: { type: Number, ref: 'Company' },
});
