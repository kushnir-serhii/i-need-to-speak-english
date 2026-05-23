import { Sidebar, Header } from '@/layout';
import EnrollmentGate from '@/components/common/EnrollmentGate';
import { ToastContainer, ConfirmModal } from '@/components/ui';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnrollmentGate>
      <div className="flex min-h-screen">
        {/* Sidebar and Backdrop */}
        <Sidebar />

        <div className="mx-auto flex w-full flex-1 flex-col">
          <Header />

          {/* Main Content */}
          <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
      <ConfirmModal />
    </EnrollmentGate>
  );
}
