import type React from "react"

interface CustomerAccount {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface CustomerAccountTableProps {
  customerAccounts: CustomerAccount[]
}

import { formatAustralianPhoneNumber } from "@/utils/phone-formatter"

const CustomerAccountTable: React.FC<CustomerAccountTableProps> = ({ customerAccounts }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        {customerAccounts.map((account) => (
          <tr key={account.id}>
            <td>{account.name}</td>
            <td>{account.email}</td>
            <td>{formatAustralianPhoneNumber(account.phone)}</td>
            <td>{account.address}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CustomerAccountTable
