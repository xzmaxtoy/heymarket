import { GridColDef } from '@mui/x-data-grid';

export interface Customer {
  id: string;
  cus_id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  city: string;
  date_active: string;
  date_create: string;
  last_sms_date: string;
  bir_dd: string;
  bir_mm: string;
  bir_yy: string;
  credit: number;
  point: number;
  fashion_percentage: number;
  shaper_percentage: number;
  bra_percentage: number;
  other_percentage: number;
  option1: string;
  option2: string;
  option3: string;
  remarks?: string;
  ref_cus_id?: string;
  staff_id?: string;
  card_store_id?: string;
  store_active?: boolean;
}

export const ALL_COLUMNS: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'cus_id', headerName: 'Customer ID', width: 120 },
  { field: 'code', headerName: 'Code', width: 100 },
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'phone', headerName: 'Phone', width: 120 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'address', headerName: 'Address', width: 200 },
  { field: 'postcode', headerName: 'Postcode', width: 100 },
  { field: 'city', headerName: 'City', width: 120 },
  { field: 'date_active', headerName: 'Active Date', width: 120, type: 'date' },
  { field: 'date_create', headerName: 'Created Date', width: 120, type: 'date' },
  { field: 'last_sms_date', headerName: 'Last SMS', width: 120, type: 'date' },
  { field: 'bir_dd', headerName: 'Birth Day', width: 100 },
  { field: 'bir_mm', headerName: 'Birth Month', width: 100 },
  { field: 'bir_yy', headerName: 'Birth Year', width: 100 },
  { field: 'credit', headerName: 'Credit', width: 100, type: 'number' },
  { field: 'point', headerName: 'Points', width: 100, type: 'number' },
  { field: 'fashion_percentage', headerName: 'Fashion %', width: 100, type: 'number' },
  { field: 'shaper_percentage', headerName: 'Shaper %', width: 100, type: 'number' },
  { field: 'bra_percentage', headerName: 'Bra %', width: 100, type: 'number' },
  { field: 'other_percentage', headerName: 'Other %', width: 100, type: 'number' },
  { field: 'option1', headerName: 'Option 1', width: 120 },
  { field: 'option2', headerName: 'Option 2', width: 120 },
  { field: 'option3', headerName: 'Option 3', width: 120 },
  { field: 'remarks', headerName: 'Remarks', width: 200 },
  { field: 'ref_cus_id', headerName: 'Ref Customer', width: 120 },
  { field: 'staff_id', headerName: 'Staff ID', width: 100 },
  { field: 'card_store_id', headerName: 'Store ID', width: 100 },
  { field: 'store_active', headerName: 'Store Active', width: 100, type: 'boolean' },
];

export const DEFAULT_COLUMNS = [
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'phone', headerName: 'Phone', width: 120 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'city', headerName: 'City', width: 120 },
  { field: 'date_active', headerName: 'Active Date', width: 120, type: 'date' },
  { field: 'credit', headerName: 'Credit', width: 100, type: 'number' },
];
