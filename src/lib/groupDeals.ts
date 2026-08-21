import type { Deal } from './cheapshark'

export interface DealEdition {
  gameID: string
  label: string
  deal: Deal
  storeCount: number
}

export interface DealGroup {
  key: string
  deal: Deal
  storeCount: number
  editions: DealEdition[]
}

const EDITION_SUFFIXES = [
  /[-–:]?\s*digital deluxe edition$/i,
  /[-–:]?\s*deluxe edition$/i,
  /[-–:]?\s*gold edition$/i,
  /[-–:]?\s*definitive edition$/i,
  /[-–:]?\s*game of the year edition$/i,
  /[-–:]?\s*goty edition$/i,
  /[-–:]?\s*ultimate edition$/i,
  /[-–:]?\s*complete edition$/i,
  /[-–:]?\s*collector'?s edition$/i,
  /[-–:]?\s*standard edition$/i,
  /[-–:]?\s*anniversary edition$/i,
]

function baseTitle(title: string): string {
  let t = title.trim()
  for (const re of EDITION_SUFFIXES) t = t.replace(re, '')
  return t.trim()
}

function editionLabel(title: string, base: string): string {
  if (title.trim().toLowerCase() === base.toLowerCase()) return 'Standard'
  const suffix = title.slice(base.length).replace(/^[-–:\s]+/, '').trim()
  return suffix || 'Standard'
}

function cheaper(a: Deal, b: Deal): Deal {
  return parseFloat(a.salePrice) <= parseFloat(b.salePrice) ? a : b
}

export function groupDeals(deals: Deal[]): DealGroup[] {
  const byGameID = new Map<string, Deal[]>()
  for (const deal of deals) {
    const list = byGameID.get(deal.gameID)
    if (list) list.push(deal)
    else byGameID.set(deal.gameID, [deal])
  }

  const representatives: { deal: Deal; storeCount: number }[] = []
  for (const [, list] of byGameID) {
    const best = list.reduce(cheaper)
    representatives.push({ deal: best, storeCount: list.length })
  }

  const byBaseTitle = new Map<string, { deal: Deal; storeCount: number }[]>()
  for (const rep of representatives) {
    const base = baseTitle(rep.deal.title)
    const list = byBaseTitle.get(base)
    if (list) list.push(rep)
    else byBaseTitle.set(base, [rep])
  }

  const groups: DealGroup[] = []
  for (const [base, reps] of byBaseTitle) {
    if (reps.length === 1) {
      groups.push({ key: reps[0].deal.gameID, deal: reps[0].deal, storeCount: reps[0].storeCount, editions: [] })
      continue
    }
    const primary = reps.reduce((a, b) => (cheaper(a.deal, b.deal) === a.deal ? a : b))
    const editions: DealEdition[] = reps.map((r) => ({
      gameID: r.deal.gameID,
      label: editionLabel(r.deal.title, base),
      deal: r.deal,
      storeCount: r.storeCount,
    }))
    groups.push({ key: primary.deal.gameID, deal: primary.deal, storeCount: primary.storeCount, editions })
  }

  return groups
}
