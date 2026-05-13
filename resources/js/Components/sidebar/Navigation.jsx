import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";

import { ClipboardList, FileText, Table2, Box } from "lucide-react";
import Dropdown from "./DropDown";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    console.log(emp_data);

    // Define all request links
    let requestLinks = [
        {
            href: route("request.form"),
            label: "Requests Slip",
            icon: <FileText className="text-base" />,
            requiresCanRequest: true, // Only visible if employee can request
        },
        {
            href: route("requestType.form"),
            label: "Request Types",
            icon: <ClipboardList className="text-base" />,
            roles: ["MIS_SUPPORT"], // only visible to MIS_SUPPORT
        },
        {
            href: route("request.table"),
            label: "Request Table",
            icon: <Table2 className="text-base" />,
        },
    ];

    // Filter links based on roles and can_request
    requestLinks = requestLinks.filter((link) => {
        // Role check
        if (
            link.roles &&
            !link.roles.some((role) => emp_data.emp_user_roles.includes(role))
        ) {
            return false;
        }
        // Can request check
        if (link.requiresCanRequest && !emp_data.can_request) {
            return false;
        }
        return true;
    });

    const issuanceLinks = [
        {
            href: route("issuance.table"),
            label: "Unit Issuance",
            icon: <Box className="text-base" />,
        },
    ];

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <Dropdown
                label="Requests"
                icon={<ClipboardList className="text-base" />}
                links={requestLinks}
                isSidebarOpen={isSidebarOpen}
            />
            <Dropdown
                label="Issuance"
                icon={<Box className="text-base" />}
                links={issuanceLinks}
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
