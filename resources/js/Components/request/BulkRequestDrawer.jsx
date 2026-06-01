import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Separator } from "@/Components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/Components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/Components/ui/form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Combobox } from "@/Components/ui/combobox";

const BulkRequestDrawer = ({
    open,
    onClose,
    item,
    onSave,
    employees,
    locations,
}) => {
    const form = useForm({
        defaultValues: {
            issued_to: "",
            issued_to_other: "",
            location: "",
            location_other: "",
            purpose: "",
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useEffect(() => {
        if (item?.bulkData) {
            form.reset({
                issued_to: item.bulkData.issued_to || "",
                issued_to_other: item.bulkData.issued_to_other || "",
                location: item.bulkData.location || "",
                location_other: item.bulkData.location_other || "",
                purpose: item.bulkData.purpose || "",
                items: item.bulkData.items || [],
            });
        }
    }, [item]);

    const watchedItems = form.watch("items");
    const issuedTo = form.watch("issued_to");
    const location = form.watch("location");

    const availableItems =
        item?.allItems?.filter(
            (i) => !watchedItems.find((ri) => ri.name === i),
        ) || [];

    const onSubmit = (data) => {
        const issuedToName =
            data.issued_to === "Other"
                ? data.issued_to_other
                : employees.find((emp) => emp.emp_id === data.issued_to)
                      ?.empname || "";

        const locationName =
            data.location === "Other"
                ? data.location_other
                : locations.find((l) => l.value === data.location)?.label || "";

        onSave({
            issued_to: data.issued_to,
            issued_to_name: issuedToName,
            issued_to_other: data.issued_to_other,
            location: data.location,
            location_name: locationName,
            location_other: data.location_other,
            purpose: data.purpose,
            items: data.items,
        });
        onClose();
    };

    const employeeOptions = [
        ...employees.map((emp) => ({
            label: `${emp.emp_id} — ${emp.empname}`,
            value: emp.emp_id,
        })),
        { label: "Other", value: "Other" },
    ];

    const locationOptions = [...locations, { label: "Other", value: "Other" }];

    const addableItemOptions = availableItems.map((name) => ({
        label: name,
        value: name,
    }));

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-3xl overflow-y-auto"
            >
                <SheetHeader className="mb-4">
                    <SheetTitle>Bulk Request — {item?.category}</SheetTitle>
                </SheetHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Request Details */}
                        <div>
                            <p className="text-sm font-semibold mb-3">
                                Request Details
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Issued To */}
                                <FormField
                                    control={form.control}
                                    name="issued_to"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issued To</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        if (val !== "Other") {
                                                            form.setValue(
                                                                "issued_to_other",
                                                                "",
                                                            );
                                                        }
                                                    }}
                                                    options={employeeOptions}
                                                    placeholder="Select Employee"
                                                    style={{ height: 36 }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {issuedTo === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="issued_to_other"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Enter Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Location */}
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        if (val !== "Other") {
                                                            form.setValue(
                                                                "location_other",
                                                                "",
                                                            );
                                                        }
                                                    }}
                                                    options={locationOptions}
                                                    placeholder="Select Location"
                                                    style={{ height: 36 }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {location === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="location_other"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Enter Location
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter location"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            {/* Purpose */}
                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter purpose of request"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Select Items */}
                        <div>
                            <p className="text-sm font-semibold mb-3">
                                Select Items
                            </p>
                            <Combobox
                                value=""
                                onChange={(val) => {
                                    if (val) append({ name: val, qty: 1 });
                                }}
                                options={addableItemOptions}
                                placeholder="Add items to this bulk request"
                                clearable={false}
                                style={{ height: 36 }}
                            />
                        </div>

                        {/* Items Table */}
                        {fields.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="w-36">
                                            Quantity
                                        </TableHead>
                                        <TableHead className="w-28">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, i) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">
                                                {field.name}
                                            </TableCell>
                                            <TableCell>
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${i}.qty`}
                                                    render={({ field: f }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    className="w-full"
                                                                    {...f}
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        f.onChange(
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => remove(i)}
                                                >
                                                    <Trash2 size={14} />
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        <Separator />

                        <SheetFooter className="flex flex-row gap-2 justify-start">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
};

export default BulkRequestDrawer;
