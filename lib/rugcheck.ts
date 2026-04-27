const RUGCHECK_BASE = 'https://api.rugcheck.xyz/v1';

export interface DeployerHistory {
  address: string;
  totalTokensDeployed: number;
  ruggedTokens: number;
  rugRate: number; // 0-1
  lastActivity: number; // unix timestamp
  knownScammer: boolean;
}

export async function getDeployerHistory(
  deployerAddress: string
): Promise<DeployerHistory | null> {
  try {
    const res = await fetch(
      `${RUGCHECK_BASE}/deployer/${deployerAddress}/report`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RUGCHECK_API_KEY ?? ''}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      address: deployerAddress,
      totalTokensDeployed: data.totalTokens ?? 0,
      ruggedTokens: data.ruggedTokens ?? 0,
      rugRate: data.rugRate ?? 0,
      lastActivity: data.lastActivityTimestamp ?? 0,
      knownScammer: data.flagged ?? false,
    };
  } catch {
    return null;
  }
}

export async function getTokenReport(mint: string) {
  try {
    // Rugcheck public endpoint — no key required for token report
    const res = await fetch(`${RUGCHECK_BASE}/tokens/${mint}/report`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
