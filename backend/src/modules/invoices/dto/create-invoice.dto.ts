import { IsUUID, IsArray, ValidateNested, IsString, IsInt, IsNumber, Min, IsOptional, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class InvoiceItemDto {
  @ApiProperty({ example: "Biaya instalasi" })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  // Tanggal invoice = awal masa aktif (periodStart). periodEnd & dueDate
  // dihitung = tanggal ini + 1 bulan. Kosong = mulai hari ini (atau menyambung
  // masa aktif berjalan bila pelanggan sudah punya invoice lunas).
  @ApiPropertyOptional({ example: "2026-10-25", description: "Tanggal mulai/terbit invoice (YYYY-MM-DD). Default: hari ini." })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  // Tanggal kirim notifikasi WA ke pelanggan. Invoice tetap dibuat sekarang,
  // tetapi WA dijadwalkan dikirim pada tanggal ini. Kosong = kirim sekarang.
  @ApiPropertyOptional({ example: "2026-10-25", description: "Jadwal kirim WA tagihan (YYYY-MM-DD). Default: kirim sekarang." })
  @IsOptional()
  @IsDateString()
  sendDate?: string;
}
