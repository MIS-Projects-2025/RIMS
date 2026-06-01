import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { PlusIcon, Trash2 } from "lucide-react";

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
import { Combobox } from "@/Components/ui/combobox";

const RequestDrawer = ({
    open,
    onClose,
    item,
    onSave,
    employees,
    locations,
}) => {
    const form = useForm({
        defaultValues: {
            purpose: "",
            rows: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "rows",
    });

    useEffect(() => {
        if (item) {
            form.reset({
                purpose: item.purpose || "",
                rows: item.items?.length
                    ? item.items.map((r) => ({
                          issued_to: r.issued_to || "",
                          issued_to_other: r.issued_to_other || "",
                          location: r.location || "",
                          location_other: r.location_other || "",
                          qty: r.qty || 1,
                      }))
                    : [],
            });
        }
    }, [item]);

    const onSubmit = (data) => {
        const finalRows = data.rows.map((r) => ({
            issued_to:
                r.issued_to === "Other" ? r.issued_to_other : r.issued_to,
            issued_to_other: r.issued_to === "Other" ? r.issued_to_other : "",
            location: r.location === "Other" ? r.location_other : r.location,
            location_other: r.location === "Other" ? r.location_other : "",
            qty: r.qty,
        }));
        onSave({ items: finalRows, purpose: data.purpose });
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

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl overflow-y-auto"
            >
                <SheetHeader className="mb-4">
                    <SheetTitle>Edit — {item?.name}</SheetTitle>
                </SheetHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Purpose */}
                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purpose of Request</FormLabel>
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

                        <Separator />

                        {/* Rows */}
                        <div className="space-y-3">
                            {fields.map((field, i) => {
                                const issuedTo = form.watch(
                                    `rows.${i}.issued_to`,
                                );
                                const location = form.watch(
                                    `rows.${i}.location`,
                                );

                                return (
                                    <div
                                        key={field.id}
                                        className="border rounded-lg p-4 space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Issued To */}
                                            <FormField
                                                control={form.control}
                                                name={`rows.${i}.issued_to`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Issued To
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Combobox
                                                                value={f.value}
                                                                onChange={(
                                                                    val,
                                                                ) => {
                                                                    f.onChange(
                                                                        val,
                                                                    );
                                                                    if (
                                                                        val !==
                                                                        "Other"
                                                                    ) {
                                                                        form.setValue(
                                                                            `rows.${i}.issued_to_other`,
                                                                            "",
                                                                        );
                                                                    }
                                                                }}
                                                                options={
                                                                    employeeOptions
                                                                }
                                                                placeholder="Select Employee"
                                                                style={{
                                                                    height: 36,
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {issuedTo === "Other" && (
                                                <FormField
                                                    control={form.control}
                                                    name={`rows.${i}.issued_to_other`}
                                                    render={({ field: f }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Enter Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter name"
                                                                    {...f}
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
                                                name={`rows.${i}.location`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Location
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Combobox
                                                                value={f.value}
                                                                onChange={(
                                                                    val,
                                                                ) => {
                                                                    f.onChange(
                                                                        val,
                                                                    );
                                                                    if (
                                                                        val !==
                                                                        "Other"
                                                                    ) {
                                                                        form.setValue(
                                                                            `rows.${i}.location_other`,
                                                                            "",
                                                                        );
                                                                    }
                                                                }}
                                                                options={
                                                                    locationOptions
                                                                }
                                                                placeholder="Select Location"
                                                                style={{
                                                                    height: 36,
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {location === "Other" && (
                                                <FormField
                                                    control={form.control}
                                                    name={`rows.${i}.location_other`}
                                                    render={({ field: f }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Enter Location
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter location"
                                                                    {...f}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            {/* Qty */}
                                            <FormField
                                                control={form.control}
                                                name={`rows.${i}.qty`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Qty
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                {...f}
                                                                onChange={(e) =>
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
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => remove(i)}
                                        >
                                            <Trash2 size={14} />
                                            Remove Row
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        <Separator />

                        <SheetFooter className="flex flex-row gap-2 justify-start">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                    append({
                                        issued_to: "",
                                        issued_to_other: "",
                                        location: "",
                                        location_other: "",
                                        qty: 1,
                                    })
                                }
                            >
                                <PlusIcon size={14} />
                                Add Row
                            </Button>
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

export default RequestDrawer;
