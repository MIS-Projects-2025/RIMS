import React, { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Separator } from "@/Components/ui/separator";
import { Send, Edit2, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { toast } from "sonner";
import HardwareModal from "./HardwareModal";
import axios from "axios";
import { cn } from "@/lib/utils";

const IssueDrawer = ({ open, onClose, request, item, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [hostnames, setHostnames] = useState([]);
    const [hostRows, setHostRows] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState(null);
    const [modalRowIndex, setModalRowIndex] = useState(null);
    const [openCombobox, setOpenCombobox] = useState({});
    const { emp_data } = usePage().props;

    useEffect(() => {
        const fetchHostnames = async () => {
            if (item?.type_of_request) {
                try {
                    const response = await axios.get(
                        route("hostnames.or.serials.list"),
                        {
                            params: { type_of_request: item.type_of_request },
                        },
                    );

                    setHostnames(
                        response.data.map((host) => ({
                            value: host.hostname || host.serial_number,
                            label: `${host.hostname || host.serial_number} - ${host.serial_number}`,
                            hostname: host.hostname,
                            serial_number: host.serial_number,
                        })),
                    );
                } catch (error) {
                    console.error("Failed to fetch hostnames:", error);
                    toast.error("Failed to load hostnames");
                }
            }
        };

        if (open) {
            fetchHostnames();
        }
    }, [item?.type_of_request, open]);

    useEffect(() => {
        if (item?.quantity && open) {
            const rows = Array.from({ length: item.quantity }, () => ({
                hostname: "",
                location: item?.location || null,
                issued_to: item?.issued_to || null,
                location_name: item?.location_name || "",
                remarks: "",
            }));
            setHostRows(rows);

            // Initialize combobox state for each row
            const comboboxState = {};
            rows.forEach((_, index) => {
                comboboxState[index] = false;
            });
            setOpenCombobox(comboboxState);
        }
    }, [item, open]);

    const updateRow = (index, field, value) => {
        const updated = [...hostRows];
        updated[index][field] = value;
        setHostRows(updated);
    };

    const toggleCombobox = (index) => {
        setOpenCombobox((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const openModalForRow = (index) => {
        const row = hostRows[index];
        setModalSearch(row.hostname);
        setModalRowIndex(index);
        setModalOpen(true);
    };

    const handleModalSave = (updatedData) => {
        if (modalRowIndex !== null) {
            const updatedRows = [...hostRows];
            updatedRows[modalRowIndex] = {
                ...updatedRows[modalRowIndex],
                hostname:
                    updatedData.hostname || updatedRows[modalRowIndex].hostname,
                location:
                    updatedData.location || updatedRows[modalRowIndex].location,
                issued_to:
                    updatedData.issued_to ||
                    updatedRows[modalRowIndex].issued_to,
                location_name:
                    updatedData.location_name ||
                    updatedRows[modalRowIndex].location_name,
                remarks:
                    updatedData.remarks || updatedRows[modalRowIndex].remarks,
            };
            setHostRows(updatedRows);

            toast.success("Item updated successfully");
        }
        setModalOpen(false);
        setModalRowIndex(null);
        setModalSearch(null);
    };

    const handleSubmit = async () => {
        // Validate hostnames
        const hasEmptyHostname = hostRows.some((row) => !row.hostname);
        if (hasEmptyHostname) {
            toast.error("Please fill in all hostnames");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                request_number: request?.request_number,
                employee_id: emp_data?.emp_id,
                hostnames: hostRows.map((row) => ({
                    hostname: row.hostname,
                    location: row.location,
                    issued_to: item?.issued_to || null,
                    remarks: row.remarks || null,
                })),
            };

            const response = await axios.post(
                route("issuance.create"),
                payload,
            );

            if (response.data.success) {
                // Update item status
                await axios.post(route("request.update-status"), {
                    item_id: item.id,
                    status: 2, // ISSUED
                });

                toast.success(
                    response.data.message || "Items issued successfully",
                );

                onClose();
                if (onSuccess) onSuccess();
            } else {
                toast.error(response.data.message || "Failed to issue items");
            }
        } catch (error) {
            console.error("Issuance error:", error);
            toast.error(
                error.response?.data?.message ||
                    "An error occurred while issuing items",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setHostRows([]);
        setOpenCombobox({});
        onClose();
    };

    const getHostnameLabel = (value) => {
        const host = hostnames.find((h) => h.value === value);
        return host?.label || value;
    };

    return (
        <>
            <Sheet open={open} onOpenChange={handleClose}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Issue Request Items</SheetTitle>
                        <SheetDescription>
                            Assign hostnames and locations for each item
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6">
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Badge variant="secondary">
                                Category: {item?.category || "-"}
                            </Badge>
                            <Badge variant="secondary">
                                Type: {item?.type_of_request || "-"}
                            </Badge>
                            <Badge variant="secondary">
                                Quantity: {item?.quantity || "-"}
                            </Badge>
                        </div>

                        <Separator className="my-4" />

                        {hostRows.length > 0 ? (
                            <div className="space-y-6">
                                {hostRows.map((row, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border rounded-lg space-y-4"
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium">
                                                Item {index + 1}
                                            </h4>
                                            {row.hostname && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        openModalForRow(index)
                                                    }
                                                    className="h-8 px-2"
                                                >
                                                    <Edit2 className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid gap-4">
                                            {/* Issued To (Read-only) */}
                                            <div className="grid gap-2">
                                                <Label>Issued To</Label>
                                                <Input
                                                    value={
                                                        item?.issued_to_name ||
                                                        "-"
                                                    }
                                                    readOnly
                                                    className="bg-muted"
                                                />
                                            </div>

                                            {/* Hostname Selection - Combobox */}
                                            <div className="grid gap-2">
                                                <Label>Hostname</Label>
                                                <Popover
                                                    open={openCombobox[index]}
                                                    onOpenChange={(open) => {
                                                        setOpenCombobox(
                                                            (prev) => ({
                                                                ...prev,
                                                                [index]: open,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={
                                                                openCombobox[
                                                                    index
                                                                ]
                                                            }
                                                            className="w-full justify-between"
                                                        >
                                                            {row.hostname
                                                                ? getHostnameLabel(
                                                                      row.hostname,
                                                                  )
                                                                : "Select hostname..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-full p-0"
                                                        align="start"
                                                        side="bottom"
                                                        sideOffset={4}
                                                        avoidCollisions={false}
                                                        style={{
                                                            maxHeight: "300px",
                                                            overflowY: "auto",
                                                        }}
                                                    >
                                                        <Command className="rounded-lg border shadow-md">
                                                            <CommandInput
                                                                placeholder="Search hostname..."
                                                                className="h-9"
                                                                autoFocus
                                                            />
                                                            <CommandList className="max-h-[200px] overflow-y-auto">
                                                                <CommandEmpty>
                                                                    No hostname
                                                                    found.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {hostnames.map(
                                                                        (
                                                                            host,
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    host.serial_number
                                                                                }
                                                                                value={
                                                                                    host.value
                                                                                }
                                                                                onSelect={(
                                                                                    currentValue,
                                                                                ) => {
                                                                                    updateRow(
                                                                                        index,
                                                                                        "hostname",
                                                                                        currentValue ===
                                                                                            row.hostname
                                                                                            ? ""
                                                                                            : currentValue,
                                                                                    );
                                                                                    setOpenCombobox(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            [index]: false,
                                                                                        }),
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        row.hostname ===
                                                                                            host.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0",
                                                                                    )}
                                                                                />
                                                                                {
                                                                                    host.label
                                                                                }
                                                                            </CommandItem>
                                                                        ),
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Location (Read-only) */}
                                            <div className="grid gap-2">
                                                <Label>Location</Label>
                                                <Input
                                                    value={row.location_name}
                                                    readOnly
                                                    className="bg-muted"
                                                />
                                            </div>

                                            {/* Remarks */}
                                            <div className="grid gap-2">
                                                <Label>
                                                    Remarks (Optional)
                                                </Label>
                                                <Textarea
                                                    placeholder="Enter remarks..."
                                                    value={row.remarks}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            index,
                                                            "remarks",
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No items to display
                            </div>
                        )}
                    </div>

                    <SheetFooter className="border-t pt-4">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || hostRows.length === 0}
                        >
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Send className="h-4 w-4 mr-2" />
                            Issue Items
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <HardwareModal
                open={modalOpen}
                searchValue={modalSearch}
                onClose={() => {
                    setModalOpen(false);
                    setModalRowIndex(null);
                    setModalSearch(null);
                }}
                onSave={handleModalSave}
            />
        </>
    );
};

export default IssueDrawer;
