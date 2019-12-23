import * as mongoose from 'mongoose';
import { CompanySchema } from '../companies';
import { UserSchema } from '../users';

mongoose.connect('mongodb://localhost/nestjsx_crud');

const Company = mongoose.model('Company', CompanySchema);
const User = mongoose.model('User', UserSchema);

export const up = async () => {
  // companies
  await Company.insertMany([
    { _id: 1, name: 'Name1', domain: 'Domain1' },
    { _id: 2, name: 'Name2', domain: 'Domain2' },
    { _id: 3, name: 'Name3', domain: 'Domain3' },
    { _id: 4, name: 'Name4', domain: 'Domain4' },
    { _id: 5, name: 'Name5', domain: 'Domain5' },
    { _id: 6, name: 'Name6', domain: 'Domain6' },
    { _id: 7, name: 'Name7', domain: 'Domain7' },
    { _id: 8, name: 'Name8', domain: 'Domain8' },
    { _id: 9, name: 'Name9', domain: 'Domain9' },
    { _id: 10, name: 'Name10', domain: 'Domain10' },
  ]);

  // users
  await User.insertMany([
    {
      _id: 1,
      email: '1@email.com',
      companyId: 1,
      profileId: 1,
      name: { first: 'firstname1', last: 'lastname1' },
    },
    {
      _id: 2,
      email: '2@email.com',
      companyId: 1,
      profileId: 2,
    },
    {
      _id: 3,
      email: '3@email.com',
      companyId: 1,
      profileId: 3,
    },
    {
      _id: 4,
      email: '4@email.com',
      companyId: 1,
      profileId: 4,
    },
    {
      _id: 5,
      email: '5@email.com',
      companyId: 1,
      profileId: 5,
    },
    {
      _id: 6,
      email: '6@email.com',
      companyId: 1,
      profileId: 6,
    },
    {
      _id: 7,
      email: '7@email.com',
      isActive: false,
      companyId: 1,
      profileId: 7,
    },
    {
      _id: 8,
      email: '8@email.com',
      isActive: false,
      companyId: 1,
      profileId: 8,
    },
    {
      _id: 9,
      email: '9@email.com',
      isActive: false,
      companyId: 1,
      profileId: 9,
    },
    {
      _id: 10,
      email: '10@email.com',
      companyId: 1,
      profileId: 10,
    },
    {
      _id: 11,
      email: '11@email.com',
      companyId: 2,
      profileId: 11,
    },
    {
      _id: 12,
      email: '12@email.com',
      companyId: 2,
      profileId: 12,
    },
    {
      _id: 13,
      email: '13@email.com',
      companyId: 2,
      profileId: 13,
    },
    {
      _id: 14,
      email: '14@email.com',
      companyId: 2,
      profileId: 14,
    },
    {
      _id: 15,
      email: '15@email.com',
      companyId: 2,
      profileId: 15,
    },
    {
      _id: 16,
      email: '16@email.com',
      companyId: 2,
      profileId: 16,
    },
    {
      _id: 17,
      email: '17@email.com',
      isActive: false,
      companyId: 2,
      profileId: 17,
    },
    {
      _id: 18,
      email: '18@email.com',
      isActive: false,
      companyId: 2,
      profileId: 18,
    },
    {
      _id: 19,
      email: '19@email.com',
      isActive: false,
      companyId: 2,
      profileId: 19,
    },
    {
      _id: 20,
      email: '20@email.com',
      isActive: false,
      companyId: 2,
      profileId: 20,
    },
    {
      _id: 21,
      email: '21@email.com',
      isActive: false,
      companyId: 2,
      profileId: 21,
    },
  ]);
};

export const down = async () => {
  await Company.deleteMany({});
  await User.deleteMany({});
};
