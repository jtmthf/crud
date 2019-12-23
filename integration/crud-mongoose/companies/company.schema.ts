import { CrudValidationGroups } from '@nestjsx/crud';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Document, Schema } from 'mongoose';

export interface Company extends Document {
  _id: number;
  name: string;
  domain: string;
  description?: string;
}

const { CREATE, UPDATE } = CrudValidationGroups;

export class CompanyDto {
  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true })
  @MaxLength(100, { always: true })
  name: string;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ groups: [CREATE, UPDATE] })
  @MaxLength(100, { groups: [CREATE, UPDATE] })
  domain: string;

  @IsOptional({ always: true })
  @IsString({ always: true })
  description: string;
}

let id = 1000;

export const CompanySchema = new Schema({
  _id: { type: Number, default: () => id++ },
  name: { type: String, required: true, maxlength: 100 },
  domain: { type: String, required: true, unique: true, maxlength: 100 },
  description: String,
});
