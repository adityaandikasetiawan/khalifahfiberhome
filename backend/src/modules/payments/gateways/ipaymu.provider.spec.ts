import { ConfigService } from "@nestjs/config";
import { IpaymuProvider } from "./ipaymu.provider";

/**
 * Test keamanan verifyCallback iPaymu.
 *
 * Kontrak yang dikunci (mencegah pembayaran palsu / komplain "kok belum lunas"):
 *  1. Callback tanpa reference_id  => ditolak (isValid=false).
 *  2. Callback tanpa trx_id        => ditolak (tidak bisa diverifikasi server-to-server).
 *  3. Status "success" HANYA jika checkTransaction (re-query ke iPaymu) mengonfirmasi.
 *  4. Payload mengaku "berhasil" tapi iPaymu bilang pending/failed => status failed.
 *  5. Error saat re-query ke iPaymu => TIDAK ditandai lunas (default aman: failed).
 */
describe("IpaymuProvider.verifyCallback", () => {
  let provider: IpaymuProvider;
  const config = {
    get: jest.fn((key: string, def?: any) => {
      const map: Record<string, string> = {
        IPAYMU_VA: "0000001234567890",
        IPAYMU_API_KEY: "test-api-key",
        IPAYMU_IS_PRODUCTION: "false",
      };
      return map[key] ?? def;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.restoreAllMocks();
    provider = new IpaymuProvider(config);
  });

  const mockFetchStatus = (statusDesc: string, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      json: async () => ({ Status: 200, Data: { StatusDesc: statusDesc } }),
    }) as any;
  };

  it("menolak callback tanpa reference_id", async () => {
    const res = await provider.verifyCallback({ trx_id: "123" });
    expect(res).toEqual({ isValid: false, orderId: "", status: "failed" });
  });

  it("menolak callback tanpa trx_id (tidak bisa diverifikasi)", async () => {
    const res = await provider.verifyCallback({ reference_id: "ORD-1" });
    expect(res.isValid).toBe(false);
    expect(res.status).toBe("failed");
  });

  it("menandai success HANYA setelah dikonfirmasi checkTransaction", async () => {
    mockFetchStatus("berhasil");
    const res = await provider.verifyCallback({ reference_id: "ORD-1", trx_id: "999" });
    expect(global.fetch).toHaveBeenCalledTimes(1); // re-query ke iPaymu
    expect(res).toEqual({ isValid: true, orderId: "ORD-1", status: "success" });
  });

  it("payload mengaku berhasil tapi iPaymu bilang pending => failed", async () => {
    mockFetchStatus("pending");
    const res = await provider.verifyCallback({ reference_id: "ORD-2", trx_id: "1000", status_code: "1" });
    expect(res.status).toBe("failed");
  });

  it("error saat re-query ke iPaymu => tidak ditandai lunas", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as any;
    const res = await provider.verifyCallback({ reference_id: "ORD-3", trx_id: "1001" });
    expect(res.isValid).toBe(false);
    expect(res.status).toBe("failed");
  });
});
