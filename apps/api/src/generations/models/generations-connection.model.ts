import { Field, ObjectType } from '@nestjs/graphql';
import { Generation } from './generation.model';

@ObjectType({ description: 'Information about pagination' })
export class PageInfo {
  @Field(() => Boolean, { description: 'Whether there are more items after the last edge' })
  hasNextPage: boolean;

  @Field(() => Boolean, { description: 'Whether there are more items before the first edge' })
  hasPreviousPage: boolean;

  @Field(() => String, { nullable: true, description: 'Cursor of the first edge' })
  startCursor?: string | null;

  @Field(() => String, { nullable: true, description: 'Cursor of the last edge' })
  endCursor?: string | null;
}

@ObjectType({ description: 'An edge in a connection' })
export class GenerationEdge {
  @Field(() => Generation, { description: 'The item at the end of the edge' })
  node: Generation;

  @Field(() => String, { description: 'A cursor for use in pagination' })
  cursor: string;
}

@ObjectType({ description: 'A paginated list of generations' })
export class GenerationsConnection {
  @Field(() => [GenerationEdge], { description: 'A list of edges' })
  edges: GenerationEdge[];

  @Field(() => PageInfo, { description: 'Information to aid in pagination' })
  pageInfo: PageInfo;

  @Field(() => Number, { description: 'Total count of items matching the query' })
  totalCount: number;
}
