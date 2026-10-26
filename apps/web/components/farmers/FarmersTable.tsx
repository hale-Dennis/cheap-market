import { regionName, type Farmer } from '@cheap-market/shared-types';

import { PRODUCE_TINTS } from '@/components/brand/ProduceArt';
import { formatGhanaianPhone } from '@/lib/phone';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface FarmersTableProps {
  farmers: Farmer[];
  caption: string;
}

export function FarmersTable({ farmers, caption }: FarmersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-[13px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 py-4 font-bold">Name</th>
            <th scope="col" className="px-5 py-4 font-bold">Region</th>
            <th scope="col" className="px-5 py-4 font-bold">Phone</th>
            <th scope="col" className="px-5 py-4 font-bold">Email</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((farmer, index) => (
            <tr key={farmer.id} className="border-t">
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-3 font-bold">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{ backgroundColor: PRODUCE_TINTS[index % PRODUCE_TINTS.length].background }}
                  >
                    {initials(farmer.fullName)}
                  </span>
                  {farmer.fullName}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-[13px] font-semibold">
                  {regionName(farmer.region)}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                {formatGhanaianPhone(farmer.phoneNumber)}
              </td>
              <td className="px-5 py-3.5">
                {farmer.email ?? (
                  <span className="text-muted-foreground">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">No email</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
