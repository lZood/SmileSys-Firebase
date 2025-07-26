import { PlusCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { inventoryItems } from "@/lib/data";

export default function InventoryPage() {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Stock': return 'secondary';
      case 'Low Stock': return 'default';
      case 'Out of Stock': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch(status) {
        case 'In Stock':
            return 'bg-green-500/20 text-green-700 border-green-500/20';
        case 'Low Stock':
            return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
        case 'Out of Stock':
            return 'bg-red-500/20 text-red-700 border-red-500/20';
        default:
            return '';
    }
  }


  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Manage your clinic's materials and instruments.
              </CardDescription>
            </div>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Item
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.stock} units</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)} className={getStatusClass(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
