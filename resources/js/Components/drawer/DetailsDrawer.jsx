import React from "react";
import dayjs from "dayjs";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import {
    CheckCircle,
    Clock,
    User,
    Wrench,
    PlusCircle,
    MinusCircle,
    Pencil,
    HardDrive,
    Boxes,
    Code,
} from "lucide-react";

export default function DetailsDrawer({
    visible,
    fieldGroups = [],
    issuanceData = null,
    loading,
    onClose,
    onAcknowledge,
    showAcknowledge = false,
    acknowledgeLoading = false,
}) {
    // ==============================
    // Operation Config
    // ==============================
    const getOperationConfig = (type) => {
        switch (type) {
            case "add":
                return {
                    icon: <PlusCircle className="w-4 h-4" />,
                    className: "bg-green-100 text-green-700",
                    text: "Add",
                };
            case "remove":
                return {
                    icon: <MinusCircle className="w-4 h-4" />,
                    className: "bg-red-100 text-red-700",
                    text: "Remove",
                };
            case "replace":
                return {
                    icon: <Pencil className="w-4 h-4" />,
                    className: "bg-blue-100 text-blue-700",
                    text: "Replace",
                };
            default:
                return {
                    icon: <Wrench className="w-4 h-4" />,
                    className: "bg-muted text-muted-foreground",
                    text: type,
                };
        }
    };

    // ==============================
    // Key/Value Renderer
    // ==============================
    const renderKeyValue = (label, value) => (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || "-"}</p>
        </div>
    );

    // ==============================
    // Component Operations Table
    // ==============================
    const renderComponentOperations = () => {
        if (!issuanceData?.operations?.length) {
            return (
                <p className="text-sm text-muted-foreground">
                    No component operations
                </p>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b">
                        <tr>
                            <th className="text-left py-2">Operation</th>
                            <th className="text-left py-2">Component Type</th>
                            <th className="text-left py-2">Details</th>
                            <th className="text-left py-2">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issuanceData.operations.map((op, i) => {
                            const config = getOperationConfig(
                                op.operation_type,
                            );

                            // Determine component data
                            const oldComp = op.old_component_data;
                            const newComp = op.new_component_data;

                            return (
                                <tr key={i} className="border-b">
                                    <td className="py-3">
                                        <Badge
                                            className={`flex items-center gap-1 w-fit ${config.className}`}
                                        >
                                            {config.icon} {config.text}
                                        </Badge>
                                    </td>

                                    <td>{op.component_type || "-"}</td>

                                    <td className="py-3">
                                        {op.operation_type === "replace" ? (
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-xs text-red-600">
                                                        Removed
                                                    </p>
                                                    <p>
                                                        Brand:{" "}
                                                        {oldComp?.brand || "-"}
                                                    </p>
                                                    <p>
                                                        Model:{" "}
                                                        {oldComp?.model || "-"}
                                                    </p>
                                                    <p>
                                                        S/N:{" "}
                                                        {oldComp?.serial_number ||
                                                            "-"}
                                                    </p>
                                                    <p>
                                                        Condition:{" "}
                                                        {op.old_component_condition ||
                                                            "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-green-600">
                                                        Added
                                                    </p>
                                                    <p>
                                                        Brand:{" "}
                                                        {newComp?.brand || "-"}
                                                    </p>
                                                    <p>
                                                        Model:{" "}
                                                        {newComp?.model || "-"}
                                                    </p>
                                                    <p>
                                                        S/N:{" "}
                                                        {newComp?.serial_number ||
                                                            "-"}
                                                    </p>
                                                    <p>
                                                        Condition:{" "}
                                                        {op.new_component_condition ||
                                                            "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p>
                                                    Brand:{" "}
                                                    {op.operation_type === "add"
                                                        ? newComp?.brand
                                                        : oldComp?.brand || "-"}
                                                </p>
                                                <p>
                                                    Model:{" "}
                                                    {op.operation_type === "add"
                                                        ? newComp?.model
                                                        : oldComp?.model || "-"}
                                                </p>
                                                <p>
                                                    S/N:{" "}
                                                    {op.operation_type === "add"
                                                        ? newComp?.serial_number
                                                        : oldComp?.serial_number ||
                                                          "-"}
                                                </p>
                                                {op.operation_type === "add" &&
                                                    newComp?.specifications && (
                                                        <p>
                                                            Specs:{" "}
                                                            {
                                                                newComp.specifications
                                                            }
                                                        </p>
                                                    )}
                                                <p>
                                                    Condition:{" "}
                                                    {op.operation_type === "add"
                                                        ? op.new_component_condition
                                                        : op.old_component_condition ||
                                                          "-"}
                                                </p>
                                            </div>
                                        )}
                                    </td>

                                    <td className="py-3">
                                        {op.reason && (
                                            <p>Reason: {op.reason}</p>
                                        )}
                                        {op.remarks && (
                                            <p className="text-xs text-muted-foreground">
                                                {op.remarks}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // ==============================
    // Render SubGroups (Parts / Software)
    // ==============================
    const renderSubGroups = (subGroups, emptyMessage) => {
        if (!subGroups?.length)
            return (
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            );

        return subGroups.map((sub, idx) => (
            <Card key={idx} className="mb-4">
                <CardHeader>
                    <CardTitle>{sub.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {sub.fields?.length ? (
                        sub.fields.map((field, i) => {
                            const value = field.value;
                            if (
                                value &&
                                typeof value === "object" &&
                                "value" in value &&
                                "color" in value
                            ) {
                                return (
                                    <Badge
                                        key={i}
                                        className={`w-fit ${value.color}`}
                                    >
                                        {value.value}
                                    </Badge>
                                );
                            }
                            return renderKeyValue(field.label, value);
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No {sub.title} Data
                        </p>
                    )}
                </CardContent>
            </Card>
        ));
    };

    // ==============================
    // Issuance Tab
    // ==============================
    const renderIssuanceTab = () => {
        if (!issuanceData)
            return (
                <p className="text-sm text-muted-foreground">
                    No Issuance Data
                </p>
            );

        const ack = issuanceData.acknowledgement;
        const users = issuanceData.hardware_users || [];

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Issuance Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        {renderKeyValue(
                            "Issuance No.",
                            issuanceData.issuance_number,
                        )}
                        {renderKeyValue(
                            "Request No.",
                            issuanceData.request_number,
                        )}
                        {renderKeyValue("Hostname", issuanceData.hostname)}
                        {renderKeyValue("Location", issuanceData.location_name)}
                        {renderKeyValue("Remarks", issuanceData.remarks)}
                        {renderKeyValue("Issued By", issuanceData.creator_name)}
                        {renderKeyValue(
                            "Issued At",
                            issuanceData.created_at
                                ? dayjs(issuanceData.created_at).format(
                                      "MMM D, YYYY hh:mm A",
                                  )
                                : "-",
                        )}
                    </CardContent>
                </Card>

                {issuanceData.operations?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Component Operations (
                                {issuanceData.operations.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>{renderComponentOperations()}</CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Users</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {users.length ? (
                            users.map((u) => (
                                <Badge
                                    key={u.user_id}
                                    className="bg-blue-100 text-blue-700 flex items-center gap-1"
                                >
                                    <User className="w-3 h-3" /> {u.user_name}
                                    {u.date_assigned && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                            (since{" "}
                                            {dayjs(u.date_assigned).format(
                                                "MMM D, YYYY",
                                            )}
                                            )
                                        </span>
                                    )}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No assigned users
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {ack?.status === 1 ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                            ) : (
                                <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                            )}
                            Acknowledgement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        {ack ? (
                            <>
                                {renderKeyValue(
                                    "Status",
                                    <Badge
                                        className={`w-fit ${ack.status_color || "bg-yellow-100 text-yellow-700"}`}
                                    >
                                        {ack.status_label || "Pending"}
                                    </Badge>,
                                )}
                                {renderKeyValue(
                                    "Acknowledged By",
                                    ack.status === 1
                                        ? ack.acknowledged_by_name
                                        : "Not yet acknowledged",
                                )}
                                {renderKeyValue(
                                    "Acknowledged At",
                                    ack.status === 1 && ack.acknowledged_at
                                        ? dayjs(ack.acknowledged_at).format(
                                              "MMM D, YYYY hh:mm A",
                                          )
                                        : "-",
                                )}
                                {ack.remarks &&
                                    renderKeyValue("Remarks", ack.remarks)}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No acknowledgement record
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ==============================
    // Tabs
    // ==============================
    const hardwareGroup = fieldGroups.find(
        (g) => g.title === "Hardware Specifications",
    );
    const partsGroup = fieldGroups.find((g) => g.title === "Parts");
    const softwareGroup = fieldGroups.find((g) => g.title === "Software");

    return (
        <Sheet open={visible} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className="!max-w-[950px] w-full p-0 flex flex-col gap-0"
                showCloseButton={false}
            >
                <SheetHeader className="px-6 py-4 border-b border-border/60 bg-card/80 flex-shrink-0">
                    <SheetTitle>Issuance Details</SheetTitle>
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Clock className="animate-spin w-6 h-6" />
                    </div>
                ) : (
                    <Tabs
                        defaultValue="issuance"
                        className="px-6 py-5 space-y-5 overflow-y-auto"
                    >
                        <TabsList>
                            <TabsTrigger value="issuance">
                                <Wrench className="w-4 h-4 mr-1" />
                                Issuance
                            </TabsTrigger>
                            <TabsTrigger value="hardware">
                                <HardDrive className="w-4 h-4 mr-1" />
                                Hardware
                            </TabsTrigger>
                            <TabsTrigger value="parts">
                                <Boxes className="w-4 h-4 mr-1" />
                                Parts
                            </TabsTrigger>
                            <TabsTrigger value="software">
                                <Code className="w-4 h-4 mr-1" />
                                Software
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="issuance">
                            {renderIssuanceTab()}
                        </TabsContent>

                        <TabsContent value="hardware">
                            {hardwareGroup?.fields?.length ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {hardwareGroup.fields.map((f, i) =>
                                        f.value?.value && f.value?.color ? (
                                            <Badge
                                                key={i}
                                                className={`w-fit ${f.value.color}`}
                                            >
                                                {f.value.value}
                                            </Badge>
                                        ) : (
                                            renderKeyValue(f.label, f.value)
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No Hardware Data
                                </p>
                            )}
                        </TabsContent>

                        <TabsContent value="parts">
                            {renderSubGroups(
                                partsGroup?.subGroups,
                                "No Parts Data",
                            )}
                        </TabsContent>

                        <TabsContent value="software">
                            {renderSubGroups(
                                softwareGroup?.subGroups,
                                "No Software Data",
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {showAcknowledge && (
                    <>
                        <Separator className="my-4" />
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={onAcknowledge}
                                disabled={acknowledgeLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />{" "}
                                Acknowledge
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
