import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import { useDrawer } from "@/Hooks/useDrawer";
import { useApiTableConfig } from "@/Hooks/useApiTableConfig";
import { usePage } from "@inertiajs/react";
import SkeletonTable from "@/Components/skeleton/SkeletonTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Eye, ThumbsUp } from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import TablePagination from "@/Components/TablePagination";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

export default function IssuanceTable() {
    const { drawerOpen, selectedItem, openDrawer, closeDrawer } = useDrawer();
    const [ackLoading, setAckLoading] = useState(false);
    const { emp_data } = usePage().props;

    const isHardwareUser = (record) =>
        (record?.hardware_users || []).some(
            (hu) => hu.user_id === emp_data?.emp_id,
        );

    const canAcknowledge = (record) =>
        record?.acknowledgement?.status === 0 && isHardwareUser(record);

    const handleAcknowledge = async (record) => {
        if (!record) return;
        if (!isHardwareUser(record)) {
            toast.error("You are not authorized to acknowledge this issuance.");
            return;
        }
        try {
            setAckLoading(true);
            await axios.put(route("issuance.acknowledge", record.id), {
                employee_id: emp_data?.emp_id,
            });
            toast.success("Acknowledged successfully");
            closeDrawer();
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message || "Failed to acknowledge",
            );
        } finally {
            setAckLoading(false);
        }
    };

    const fetchDetails = async (record) => {
        try {
            const { data: res } = await axios.get(
                route("hardware.full.details", { hardwareId: record.hostname }),
            );
            if (!res?.success) return { fieldGroups: [] };
            const hw = res.data;

            const partsArray = (hw.parts || []).map((part) => ({
                id: part.id,
                title: part.part_type || "Part",
                fields: [
                    { label: "Part Type", value: part.part_type || "-" },
                    { label: "Brand", value: part.brand || "-" },
                    { label: "Model", value: part.model || "-" },
                    {
                        label: "Serial Number",
                        value: part.serial_number || "-",
                    },
                    { label: "Status", value: part.status || "-" },
                ],
            }));

            const softwareArray = (hw.software || []).map((s) => ({
                id: s.id,
                title: s.software_inventory?.software_name || "Software",
                fields: [
                    {
                        label: "Version",
                        value: s.software_inventory?.version || "-",
                    },
                    {
                        label: "Type",
                        value: s.software_inventory?.software_type || "-",
                    },
                    {
                        label: "Installed On",
                        value: s.installation_date || "-",
                    },
                ],
            }));

            const fieldGroups = [
                {
                    title: "Hardware Specifications",
                    fields: [
                        { label: "Hostname", value: hw.hostname },
                        { label: "Brand", value: hw.brand },
                        { label: "Model", value: hw.model },
                        { label: "Category", value: hw.category },
                        { label: "Serial Number", value: hw.serial_number },
                        // { label: "Processor", value: hw.processor },
                        // { label: "Motherboard", value: hw.motherboard },
                        { label: "IP Address", value: hw.ip_address || "-" },
                        { label: "Wifi MAC", value: hw.wifi_mac || "-" },
                        { label: "LAN MAC", value: hw.lan_mac || "-" },
                        {
                            label: "Department",
                            value: hw.department_name || "-",
                        },
                        { label: "Location", value: hw.location_name || "-" },
                        { label: "Product Line", value: hw.pl_name || "-" },
                        { label: "Station", value: hw.station_name || "-" },
                    ],
                },
                { title: "Parts", subGroups: partsArray },
                { title: "Software", subGroups: softwareArray },
            ];

            return { fieldGroups };
        } catch (error) {
            console.error("Failed to fetch details:", error);
            return { fieldGroups: [] };
        }
    };

    const handleView = async (record) => {
        const details = await fetchDetails(record);
        openDrawer({ ...record, ...details });
    };

    const columnDefinitions = [
        { key: "issuance_number", label: "Issuance No.", sortable: true },
        { key: "request_number", label: "Request No.", sortable: true },
        { key: "hostname", label: "Hostname", sortable: true },
        { key: "location_name", label: "Location", sortable: true },
        {
            key: "hardware_users",
            label: "Assigned Users",
            render: (record) => {
                const users = record.hardware_users || [];
                if (!users.length)
                    return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {users.map((hu) => (
                            <Badge key={hu.user_id} variant="secondary">
                                {hu.user_name}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        { key: "remarks", label: "Remarks" },
        {
            key: "created_at",
            label: "Issued At",
            sortable: true,
            render: (record) =>
                record.created_at
                    ? dayjs(record.created_at).format("MMM D, YYYY hh:mm A")
                    : "-",
        },
        { key: "creator_name", label: "Issued By", sortable: true },
        {
            key: "acknowledgement_status",
            label: "Status",
            render: (record) => {
                const color = record.acknowledgement?.status_color || "blue";
                const label = record.acknowledgement?.status_label || "Pending";
                const colorMap = {
                    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                    lime: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
                    yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
                    red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                };
                return (
                    <Badge
                        className={
                            colorMap[color] || "bg-gray-50 text-gray-700"
                        }
                    >
                        {label}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            label: "Actions",
            render: (record) => {
                const acknowledgeAllowed = canAcknowledge(record);
                return (
                    <Button
                        variant={acknowledgeAllowed ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleView(record)}
                        disabled={ackLoading}
                    >
                        {acknowledgeAllowed ? (
                            <ThumbsUp size={15} />
                        ) : (
                            <Eye size={15} />
                        )}
                    </Button>
                );
            },
        },
    ];

    const { data, loading, paginationConfig, fetchData } = useApiTableConfig(
        route("issuance.list"),
        columnDefinitions,
    );

    const showAcknowledgeButton =
        selectedItem?.acknowledgement?.status === 0 &&
        isHardwareUser(selectedItem);

    return (
        <AuthenticatedLayout>
            <Card className="shadow-sm border-border/60 flex flex-col overflow-hidden">
                <CardHeader className="px-4 py-3 flex-shrink-0 border-b">
                    <CardTitle className="text-base">Issuance Table</CardTitle>
                </CardHeader>

                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                    {loading ? (
                        <div className="p-4">
                            <SkeletonTable columns={5} rows={5} />
                        </div>
                    ) : (
                        <>
                            {/* Scrollable table area */}
                            <div className="flex-1 overflow-auto min-h-0">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                                        <TableRow>
                                            {columnDefinitions.map((col) => (
                                                <TableHead
                                                    key={col.key}
                                                    className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                                >
                                                    {col.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={
                                                        columnDefinitions.length
                                                    }
                                                    className="h-32 text-center text-muted-foreground text-sm"
                                                >
                                                    No records found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    className="hover:bg-muted/40 transition-colors"
                                                >
                                                    {columnDefinitions.map(
                                                        (col) => (
                                                            <TableCell
                                                                key={col.key}
                                                                className="text-sm py-2"
                                                            >
                                                                {col.render
                                                                    ? col.render(
                                                                          record,
                                                                      )
                                                                    : (record[
                                                                          col
                                                                              .key
                                                                      ] ?? "-")}
                                                            </TableCell>
                                                        ),
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination pinned to bottom */}
                            <div className="flex-shrink-0 border-t px-4 py-2 bg-background">
                                <TablePagination
                                    pagination={paginationConfig}
                                    onChange={(page) => fetchData(page)}
                                    onChangePerPage={(perPage) =>
                                        fetchData(1, perPage)
                                    }
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <DetailsDrawer
                visible={drawerOpen}
                fieldGroups={selectedItem?.fieldGroups || []}
                issuanceData={selectedItem}
                loading={false}
                onClose={closeDrawer}
                showAcknowledge={showAcknowledgeButton}
                onAcknowledge={() => handleAcknowledge(selectedItem)}
                acknowledgeLoading={ackLoading}
            />
        </AuthenticatedLayout>
    );
}
