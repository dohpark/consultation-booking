import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpsertConsultationNoteDto {
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용은 필수입니다.' })
  @MaxLength(10000, { message: '내용은 최대 10000자까지 입력할 수 있습니다.' })
  content: string;
}
