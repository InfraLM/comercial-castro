import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDatabaseSection } from "@/components/admin/AdminDatabaseSection";
import { AdminClintRegistration } from "@/components/admin/AdminClintRegistration";
import { MeetingsConfigSection } from "@/components/admin/MeetingsConfigSection";
import { UserMappingSection } from "@/components/admin/UserMappingSection";

const Admin = () => {
  const [activeSection, setActiveSection] = useState("database");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {activeSection === "database" && <AdminDatabaseSection />}
        {activeSection === "users" && <UserMappingSection />}
        {activeSection === "meetings" && <MeetingsConfigSection />}
        {activeSection === "clint" && <AdminClintRegistration />}
      </div>
    </div>
  );
};

export default Admin;
