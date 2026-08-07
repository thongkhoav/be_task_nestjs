import { getMetadataArgsStorage } from 'typeorm';
import { User } from './user.entity';
import { UserRoom } from './user-room.entity';

describe('authentication database uniqueness metadata', () => {
  it('marks user email as unique', () => {
    const emailColumn = getMetadataArgsStorage().columns.find(
      (column) => column.target === User && column.propertyName === 'email',
    );

    expect(emailColumn?.options.unique).toBe(true);
  });

  it('defines one active membership per user and room', () => {
    const membershipIndex = getMetadataArgsStorage().indices.find(
      (index) =>
        index.target === UserRoom &&
        index.unique === true &&
        index.where === '"deletedDate" IS NULL',
    );

    expect(membershipIndex).toBeDefined();
  });
});
