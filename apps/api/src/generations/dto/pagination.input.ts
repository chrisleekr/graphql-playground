import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 20, description: 'Number of items to return' })
  @Min(1)
  @Max(100)
  first?: number = 20;

  @Field(() => String, {
    nullable: true,
    description: 'Cursor to start after (for forward pagination)',
  })
  after?: string;
}
