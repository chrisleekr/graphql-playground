import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateGenerationInput {
  @Field()
  @IsString()
  @MaxLength(500)
  prompt: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  forceFail?: boolean;
}
