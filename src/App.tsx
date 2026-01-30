import type { ColumnDef } from './components/Table';
import { Table } from './components/Table';

/** Repo içi geliştirme: komponenti boş veri ile gösterir. Paket (npm) sadece Table export eder. */
const columns: ColumnDef<Record<string, unknown>>[] = [
  { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
];

export function App() {
  return (
    <>
      <div className="demo-table-container">
        <Table<Record<string, unknown>>
          data={[]}
          columns={columns}
          keyColumnId="id"
          emptyMessage="Kayıt bulunamadı"
          minHeight={280}
        />
      </div>
    </>
  );
}
