import { regionName, type Farmer } from '@cheap-market/shared-types';

import { formatGhanaianPhone } from '@/lib/phone';

interface FarmersTableProps {
  farmers: Farmer[];
  caption: string;
}

export function FarmersTable({ farmers, caption }: FarmersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Name</th>
            <th scope="col" className="px-4 py-3 font-medium">Region</th>
            <th scope="col" className="px-4 py-3 font-medium">Phone</th>
            <th scope="col" className="px-4 py-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((farmer) => (
            <tr key={farmer.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{farmer.fullName}</td>
              <td className="px-4 py-3">{regionName(farmer.region)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {formatGhanaianPhone(farmer.phoneNumber)}
              </td>
              <td className="px-4 py-3">
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
