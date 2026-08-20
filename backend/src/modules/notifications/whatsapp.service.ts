import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly config: ConfigService) {}

  async sendMessage(phone: string, message: string): Promise<void> {
    const baseUrl = this.config.get<string>("WA_API_BASE_URL");
    const phoneNumberId = this.config.get<string>("WA_PHONE_NUMBER_ID");
    const accessToken = this.config.get<string>("WA_ACCESS_TOKEN");

    const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gagal mengirim WhatsApp ke ${phone}: ${errorText}`);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
  }
}
