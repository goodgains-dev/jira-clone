import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrganization } from "@/actions/organizations";
import OrgSwitcher from "@/components/org-switcher";
import ProjectList from "./_components/project-list";
import UserIssues from "./_components/user-issues";
import Link from "next/link";
import { BarChart, FileEdit, Building2 } from "lucide-react";

export default async function OrganizationPage({ params }) {
  const { orgId } = params;
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const organization = await getOrganization(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start">
        <h1 className="text-5xl font-bold gradient-title pb-2">
          {organization.name}&rsquo;s Projects
        </h1>

        <div className="flex items-center gap-4">
          <Link
            href={`/organization/${organization.id}/analytics`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <BarChart size={18} />
            <span>Analytics</span>
          </Link>
          <Link
            href={`/organization/${organization.id}/form-builder`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            <FileEdit size={18} />
            <span>Form Builder</span>
          </Link>
          <Link
            href={`/organization/${organization.id}/departments`}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Building2 size={18} />
            <span>Departments</span>
          </Link>
          <OrgSwitcher />
        </div>
      </div>
      <div className="mb-4">
        <ProjectList orgId={organization.id} />
      </div>
      <div className="mt-8">
        <UserIssues userId={userId} />
      </div>
    </div>
  );
}
