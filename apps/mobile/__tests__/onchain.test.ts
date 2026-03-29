/**
 * Tests for the on-chain data fetching module (lib/onchain.ts).
 *
 * Covers: fetchEVMActivity, fetchEVMNFTTransfers, fetchWalletSummary,
 * protocol detection, and rate limiting.
 */

declare const global: { fetch: jest.Mock; __DEV__: boolean };
global.__DEV__ = true;

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

import {
  fetchEVMActivity,
  fetchEVMNFTTransfers,
  fetchWalletSummary,
} from "../lib/onchain";

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const UNISWAP_V3_ADDRESS = "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45";
const ARBITRUM_BRIDGE_ADDRESS = "0x3154cf16ccdb4c6d922629664174b904d80f2c35";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function createMockEtherscanResponse(
  txs: readonly Record<string, string>[],
): { readonly status: string; readonly result: readonly Record<string, string>[] } {
  return {
    status: "1",
    result: txs,
  };
}

function createMockTx(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
    hash: "0xabc",
    from: VALID_ADDRESS,
    to: UNISWAP_V3_ADDRESS,
    value: "0",
    gasUsed: "150000",
    gasPrice: "20000000000",
    timeStamp: "1711900800",
    isError: "0",
    contractAddress: "",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// fetchEVMActivity
// ---------------------------------------------------------------------------

describe("fetchEVMActivity", () => {
  it("should parse a valid etherscan response into OnchainActivity", async () => {
    const mockTx = createMockTx();
    const mockData = createMockEtherscanResponse([mockTx]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    expect(result.address).toBe(VALID_ADDRESS);
    expect(result.chain).toBe("ethereum");
    expect(result.totalTransactions).toBe(1);
    expect(result.uniqueContracts).toBe(1);
    expect(result.firstActivity).not.toBeNull();
    expect(result.lastActivity).not.toBeNull();
    expect(parseFloat(result.totalGasUsedETH)).toBeGreaterThan(0);
    expect(result.swapTransactions).toBe(1);
    expect(result.protocols.length).toBeGreaterThanOrEqual(1);
    expect(result.protocols[0].name).toBe("Uniswap V3");
    expect(result.fetchedAt).toBeDefined();
  });

  it("should return empty activity on API error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    expect(result.totalTransactions).toBe(0);
    expect(result.firstActivity).toBeNull();
    expect(result.lastActivity).toBeNull();
    expect(result.protocols).toEqual([]);
    expect(result.uniqueContracts).toBe(0);
  });

  it("should return empty activity for an invalid address", async () => {
    global.fetch = jest.fn();

    const result = await fetchEVMActivity("not-a-valid-address", "ethereum");

    expect(result.totalTransactions).toBe(0);
    expect(result.protocols).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return empty activity when API returns error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: "0",
        message: "No transactions found",
        result: "No transactions found",
      }),
    });

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    expect(result.totalTransactions).toBe(0);
    expect(result.protocols).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fetchEVMNFTTransfers
// ---------------------------------------------------------------------------

describe("fetchEVMNFTTransfers", () => {
  it("should count mints (from = zero address)", async () => {
    const nftTransfers = [
      createMockTx({ from: ZERO_ADDRESS, to: VALID_ADDRESS, contractAddress: "0xnft1" }),
      createMockTx({ from: ZERO_ADDRESS, to: VALID_ADDRESS, contractAddress: "0xnft2" }),
      createMockTx({ from: "0xsomeone", to: VALID_ADDRESS, contractAddress: "0xnft3" }),
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(createMockEtherscanResponse(nftTransfers)),
    });

    const mintCount = await fetchEVMNFTTransfers(VALID_ADDRESS, "ethereum");

    expect(mintCount).toBe(2);
  });

  it("should return 0 for invalid address", async () => {
    global.fetch = jest.fn();

    const mintCount = await fetchEVMNFTTransfers("invalid", "ethereum");

    expect(mintCount).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return 0 when API fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("timeout"));

    const mintCount = await fetchEVMNFTTransfers(VALID_ADDRESS, "ethereum");

    expect(mintCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fetchWalletSummary
// ---------------------------------------------------------------------------

describe("fetchWalletSummary", () => {
  it("should aggregate activity across multiple chains", async () => {
    const ethTx = createMockTx({ timeStamp: "1711900800" });
    const arbTx = createMockTx({
      to: ARBITRUM_BRIDGE_ADDRESS,
      timeStamp: "1711900900",
    });

    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount += 1;
      // Alternate between eth txlist, eth nft, arb txlist, arb nft
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockEtherscanResponse([ethTx])),
        });
      }
      if (callCount === 2) {
        // NFT transfers for ethereum - 0 mints
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockEtherscanResponse([])),
        });
      }
      if (callCount === 3) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockEtherscanResponse([arbTx])),
        });
      }
      // NFT transfers for arbitrum - 0 mints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockEtherscanResponse([])),
      });
    });

    const summary = await fetchWalletSummary(VALID_ADDRESS, [
      "ethereum",
      "arbitrum",
    ]);

    expect(summary.address).toBe(VALID_ADDRESS);
    expect(summary.totalTxAcrossChains).toBe(2);
    expect(summary.activeChains).toBe(2);
    expect(summary.chains).toHaveLength(2);
    expect(parseFloat(summary.estimatedGasSpentUSD)).toBeGreaterThan(0);
  });

  it("should handle chains with no activity", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "0",
          message: "No transactions found",
          result: [],
        }),
    });

    const summary = await fetchWalletSummary(VALID_ADDRESS, ["ethereum"]);

    expect(summary.totalTxAcrossChains).toBe(0);
    expect(summary.activeChains).toBe(0);
    expect(summary.estimatedGasSpentUSD).toBe("0.00");
  });
});

// ---------------------------------------------------------------------------
// Protocol detection
// ---------------------------------------------------------------------------

describe("Protocol detection", () => {
  it("should identify Uniswap V3 transactions", async () => {
    const tx = createMockTx({ to: UNISWAP_V3_ADDRESS });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockEtherscanResponse([tx])),
    });

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    const uniswap = result.protocols.find((p) => p.name === "Uniswap V3");
    expect(uniswap).toBeDefined();
    expect(uniswap!.txCount).toBe(1);
    expect(uniswap!.address).toBe(UNISWAP_V3_ADDRESS);
  });

  it("should identify bridge transactions", async () => {
    const tx = createMockTx({ to: ARBITRUM_BRIDGE_ADDRESS });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockEtherscanResponse([tx])),
    });

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    expect(result.bridgeTransactions).toBe(1);
    const bridge = result.protocols.find((p) =>
      p.name.includes("Bridge"),
    );
    expect(bridge).toBeDefined();
  });

  it("should count multiple protocol interactions", async () => {
    const txs = [
      createMockTx({ to: UNISWAP_V3_ADDRESS, timeStamp: "1711900800" }),
      createMockTx({ to: UNISWAP_V3_ADDRESS, timeStamp: "1711900900" }),
      createMockTx({ to: ARBITRUM_BRIDGE_ADDRESS, timeStamp: "1711901000" }),
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockEtherscanResponse(txs)),
    });

    const result = await fetchEVMActivity(VALID_ADDRESS, "ethereum");

    const uniswap = result.protocols.find((p) => p.name === "Uniswap V3");
    expect(uniswap).toBeDefined();
    expect(uniswap!.txCount).toBe(2);
    expect(result.swapTransactions).toBe(2);
    expect(result.bridgeTransactions).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe("Rate limiting", () => {
  it("should space calls at least 200ms apart per chain", async () => {
    jest.useFakeTimers();

    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve(
          createMockEtherscanResponse([createMockTx()]),
        ),
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    // Fire two calls in quick succession
    const call1 = fetchEVMActivity(VALID_ADDRESS, "ethereum");

    // Advance past rate limit
    jest.advanceTimersByTime(250);
    await Promise.resolve();

    const call2 = fetchEVMActivity(VALID_ADDRESS, "ethereum");

    // Advance time to allow the second call's rate limiter
    jest.advanceTimersByTime(250);
    await Promise.resolve();

    // Resolve remaining microtasks
    jest.advanceTimersByTime(1000);

    const [result1, result2] = await Promise.all([call1, call2]);

    expect(result1.totalTransactions).toBe(1);
    expect(result2.totalTransactions).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
