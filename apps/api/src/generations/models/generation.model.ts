import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GenerationStatus as PrismaGenerationStatus } from '@repo/database';

// Re-export Prisma's GenerationStatus for use in GraphQL
export const GenerationStatus = PrismaGenerationStatus;
export type GenerationStatus = PrismaGenerationStatus;

registerEnumType(PrismaGenerationStatus, {
  name: 'GenerationStatus',
  description: 'The status of a generation',
});

@ObjectType({ description: 'generations' })
export class Generation {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  prompt: string;

  @Field(() => PrismaGenerationStatus)
  status: PrismaGenerationStatus;

  @Field(() => String, { nullable: true })
  result?: string | null;

  @Field(() => String, { nullable: true })
  error?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  startedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;
}
