export const branchMap: Record<number, string> = {
  1: 'CS',
  2: 'IT',
  3: 'EXTC',
  4: 'Mech',
}

export const getBranchLabel = (branchId?: number | null) =>
  branchId ? branchMap[branchId] ?? `Branch ${branchId}` : 'All Branches'
