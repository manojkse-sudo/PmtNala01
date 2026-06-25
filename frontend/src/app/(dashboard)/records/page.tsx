"use client";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { Plus, FileText } from "lucide-react";

export default function RecordsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Medical Records"
        actions={
          <Link href="/records/new">
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Record</Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Browse records via patients"
            description="Open a patient's profile to view or create their medical records."
            action={
              <Link href="/patients">
                <Button variant="outline" size="sm">Go to Patients</Button>
              </Link>
            }
          />
        </Card>
      </div>
    </div>
  );
}
