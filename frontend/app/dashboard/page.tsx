import DashboardLayout from "./DashboardLayout";
import { AuthProvider } from "@/lib/auth";

const DashboardPage: React.FC = () => {
  return (
    <AuthProvider>
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </DashboardLayout>
    </AuthProvider>
  );
};
export default DashboardPage;