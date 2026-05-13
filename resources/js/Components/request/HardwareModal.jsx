import React, { useEffect, useState, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";
import { Plus, Loader2, CircleMinus } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Your existing hooks
import {
    convertDatesToDayjs,
    convertDayjsToStrings,
} from "../utils/dateHelper";
import { useRemovalModal } from "@/Hooks/useRemovalModal";
import RemovalReasonModal from "../modal/RemovalReasonModal";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";
import { Combobox } from "../ui/combobox";

// Create an adapter to make react-hook-form work with Ant Design's form API
const createFormAdapter = (rhfForm) => {
    return {
        getFieldValue: (name) => {
            // Handle nested field names like "parts[0].part_type" or "parts.0.part_type"
            if (name.includes("[") && name.includes("]")) {
                // Convert Ant Design format "parts[0].part_type" to react-hook-form format "parts.0.part_type"
                const convertedName = name.replace(/\[(\d+)\]/g, ".$1");
                return rhfForm.getValues(convertedName);
            }
            return rhfForm.getValues(name);
        },
        setFieldsValue: (values) => {
            rhfForm.reset(values);
        },
        // Add any other Ant Design form methods that might be needed
    };
};

const HardwareModal = ({ open, onClose, searchValue, onSave, item }) => {
    const [hardware, setHardware] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("specs");
    const [removedItems, setRemovedItems] = useState({
        parts: [],
        software: [],
    });

    // Create refs to track loading state
    const initialOptionsLoaded = useRef({
        parts: false,
        software: false,
    });

    const loadingPartsOptions = useRef(false);
    const loadingSoftwareOptions = useRef(false);
    const partsLoadAttempted = useRef(false);
    const softwareLoadAttempted = useRef(false);

    const { emp_data } = usePage().props;

    // Initialize react-hook-form
    const form = useForm({
        defaultValues: {
            hostname: "",
            serial: "",
            model: "",
            brand: "",
            // processor: "",
            // motherboard: "",
            ip_address: "",
            wifi_mac: "",
            lan_mac: "",
            remarks: "",
            parts: [],
            software: [],
        },
    });

    // Create an adapter form for the hooks
    const adapterForm = createFormAdapter(form);

    // Parts & software hooks - pass the adapter form
    const {
        partsOptions,
        loadPartTypes,
        loadBrands,
        loadModels,
        loadSpecifications,
    } = useHardwareParts(adapterForm);

    const {
        softwareOptions,
        loadSoftwareNames,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
    } = useHardwareSoftware(adapterForm);

    const {
        removalModalVisible,
        pendingRemoval,
        removalForm,
        handleRemoveWithReason,
        confirmRemoval,
        cancelRemoval,
    } = useRemovalModal(adapterForm, setRemovedItems);

    // Field arrays for dynamic lists
    const {
        fields: partFields,
        append: appendPart,
        remove: removePart,
    } = useFieldArray({
        control: form.control,
        name: "parts",
    });

    const {
        fields: softwareFields,
        append: appendSoftware,
        remove: removeSoftware,
    } = useFieldArray({
        control: form.control,
        name: "software",
    });

    // ======================================
    // Fetch hardware details only
    // ======================================
    useEffect(() => {
        if (!open || !searchValue) return;

        const parseSpecs = (specsValue) => {
            if (!specsValue) return { specifications: "", condition: "" };
            try {
                if (specsValue.startsWith("{")) {
                    const parsed = JSON.parse(specsValue);
                    return {
                        specifications: parsed.specifications || "",
                        condition: parsed.condition || "",
                    };
                }
            } catch (e) {
                console.log("Failed to parse specifications JSON:", e);
            }
            return { specifications: specsValue, condition: "" };
        };

        const fetchHardware = async () => {
            setLoading(true);
            try {
                form.reset();

                const { data: res } = await axios.get(
                    route("hardware.full.details", searchValue),
                );
                if (!res?.success) return;

                const hw = res.data;
                setHardware(hw);
                console.log("Hardware fetched:", hw);

                // Transform parts & software for form display
                const partsArray = (hw.parts || []).map((part) => {
                    const { specifications, condition } = parseSpecs(
                        part.specifications,
                    );
                    return {
                        id: part.id,
                        part_type: part.part_type || "",
                        brand: part.brand || "",
                        model: part.model || "",
                        serial_number: part.serial_number || "",
                        specifications,
                        condition,
                        status: part.status || "",
                    };
                });

                const softwareArray = (hw.software || []).map((sw) => {
                    const licenseKey =
                        sw.software_license?.license_key ??
                        sw.software_license?.account_user ??
                        "";
                    return {
                        id: sw.id,
                        name: sw.software_inventory?.software_name || "",
                        type: sw.software_inventory?.software_type || "",
                        version: sw.software_inventory?.version || "",
                        publisher: sw.software_inventory?.publisher || "",
                        license_key: licenseKey,
                        _license_identifier: licenseKey,
                        _original_license_key: sw.software_license?.license_key,
                        _original_account_user:
                            sw.software_license?.account_user,
                        account_user: sw.software_license?.account_user || null,
                        account_password:
                            sw.software_license?.account_password || null,
                        license_type: sw.software_inventory?.license_type || "",
                        expiration_date:
                            sw.software_license?.expiration_date || "",
                        installation_date: sw.installation_date || "",
                        status: sw.status || "",
                        qty: sw.software_license?.max_activations || "",
                    };
                });

                form.reset({
                    hostname: hw.hostname,
                    serial: hw.serial_number,
                    model: hw.model,
                    brand: hw.brand,
                    processor: hw.processor,
                    motherboard: hw.motherboard,
                    ip_address: hw.ip_address,
                    wifi_mac: hw.wifi_mac,
                    lan_mac: hw.lan_mac,
                    remarks: hw.remarks,
                    parts: partsArray,
                    software: softwareArray,
                });

                // Reset loading flags
                initialOptionsLoaded.current = {
                    parts: false,
                    software: false,
                };
                loadingPartsOptions.current = false;
                loadingSoftwareOptions.current = false;
                partsLoadAttempted.current = false;
                softwareLoadAttempted.current = false;
            } catch (err) {
                console.error("Fetch hardware error:", err);
                toast.error("Failed to fetch hardware details");
            } finally {
                setLoading(false);
            }
        };

        fetchHardware();
    }, [open, searchValue, form]);

    // ======================================
    // Load options for existing parts after data is loaded
    // ======================================
    useEffect(() => {
        // Don't run if no hardware, no parts, already loaded, or currently loading
        if (
            !hardware ||
            !partFields.length ||
            initialOptionsLoaded.current.parts ||
            loadingPartsOptions.current ||
            partsLoadAttempted.current
        ) {
            return;
        }

        const loadExistingPartOptions = async () => {
            loadingPartsOptions.current = true;
            partsLoadAttempted.current = true;

            console.log("Loading existing part options...");

            try {
                await loadPartTypes();

                // Load options for each part sequentially
                for (let i = 0; i < partFields.length; i++) {
                    const part = form.getValues(`parts.${i}`);
                    if (!part) continue;

                    const fieldName = `parts[${i}]`;

                    console.log(
                        `Loading options for part ${i}:`,
                        part.part_type,
                        part.brand,
                        part.model,
                    );

                    if (part.part_type) {
                        await loadBrands(part.part_type, fieldName);

                        if (part.brand) {
                            await loadModels(
                                part.part_type,
                                part.brand,
                                fieldName,
                            );

                            if (part.model && part.part_type && part.brand) {
                                await loadSpecifications(
                                    part.part_type,
                                    part.brand,
                                    part.model,
                                    fieldName,
                                    i,
                                );
                            }
                        }
                    }

                    // Small delay to prevent overwhelming the API
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                initialOptionsLoaded.current.parts = true;
                console.log("Finished loading part options");
            } catch (error) {
                console.error("Error loading part options:", error);
            } finally {
                loadingPartsOptions.current = false;
            }
        };

        loadExistingPartOptions();
    }, [hardware, partFields.length]); // Only depend on hardware and partFields.length

    // ======================================
    // Load options for existing software after data is loaded
    // ======================================
    useEffect(() => {
        // Don't run if no hardware, no software, already loaded, or currently loading
        if (
            !hardware ||
            !softwareFields.length ||
            initialOptionsLoaded.current.software ||
            loadingSoftwareOptions.current ||
            softwareLoadAttempted.current
        ) {
            return;
        }

        const loadExistingSoftwareOptions = async () => {
            loadingSoftwareOptions.current = true;
            softwareLoadAttempted.current = true;

            console.log("Loading existing software options...");

            try {
                await loadSoftwareNames();

                for (let i = 0; i < softwareFields.length; i++) {
                    const sw = form.getValues(`software.${i}`);
                    if (!sw) continue;

                    const fieldName = `software[${i}]`;

                    console.log(
                        `Loading options for software ${i}:`,
                        sw.name,
                        sw.type,
                        sw.version,
                    );

                    if (sw.name) {
                        await loadSoftwareTypes(sw.name, fieldName);

                        if (sw.type) {
                            await loadSoftwareVersions(
                                sw.name,
                                sw.type,
                                fieldName,
                            );

                            if (sw.version) {
                                await loadSoftwareLicenses(
                                    sw.name,
                                    sw.type,
                                    sw.version,
                                    fieldName,
                                    i,
                                );
                            }
                        }
                    }

                    // Small delay to prevent overwhelming the API
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                initialOptionsLoaded.current.software = true;
                console.log("Finished loading software options");
            } catch (error) {
                console.error("Error loading software options:", error);
            } finally {
                loadingSoftwareOptions.current = false;
            }
        };

        loadExistingSoftwareOptions();
    }, [hardware, softwareFields.length]); // Only depend on hardware and softwareFields.length

    // ======================================
    // Tab change handler - lazy load dropdowns
    // ======================================
    const handleTabChange = async (value) => {
        setActiveTab(value);

        if (
            value === "parts" &&
            !initialOptionsLoaded.current.parts &&
            !loadingPartsOptions.current
        ) {
            await loadPartTypes();
        } else if (
            value === "software" &&
            !initialOptionsLoaded.current.software &&
            !loadingSoftwareOptions.current
        ) {
            await loadSoftwareNames();
        }
    };

    // ======================================
    // Form submission
    // ======================================
    const onSubmit = async (values) => {
        const formattedValues = convertDayjsToStrings(values);

        // Clean up parts specifications
        if (formattedValues.parts) {
            formattedValues.parts = formattedValues.parts.map((part) => {
                if (part.specifications?.startsWith("{")) {
                    try {
                        const parsed = JSON.parse(part.specifications);
                        part.specifications = parsed.specifications || parsed;
                    } catch {}
                }
                return part;
            });
        }

        // Clean up software license/account_user
        if (formattedValues.software) {
            formattedValues.software = formattedValues.software.map(
                (sw, index) => {
                    const fieldName = `software[${index}]`;
                    const licenseOptions =
                        softwareOptions?.licenses?.[fieldName] || [];
                    const selectedOption = licenseOptions.find(
                        (opt) => opt.value === sw._license_identifier,
                    );
                    const licenseData = selectedOption?.license_data;

                    const result = {
                        ...sw,
                        _license_identifier: undefined,
                        _original_license_key: undefined,
                        _original_account_user: undefined,
                    };

                    if (licenseData) {
                        if (licenseData.license_key) {
                            result.license_key = sw._license_identifier;
                            result.account_user = null;
                            result.account_password = null;
                        } else {
                            result.license_key = null;
                            result.account_user = sw._license_identifier;
                            result.account_password =
                                licenseData.account_password || null;
                        }
                    }

                    return result;
                },
            );
        }

        // Handle removed items
        Object.entries(removedItems).forEach(([key, items]) => {
            if (items.length > 0) {
                formattedValues[key] = formattedValues[key] || [];
                items.forEach((removedItem) => {
                    formattedValues[key].push({
                        id: removedItem.id,
                        _delete: true,
                        removal_reason: removedItem.reason,
                        removal_condition: removedItem.condition,
                        removal_remarks: removedItem.remarks,
                    });
                });
            }
        });
        console.log({ ...formattedValues });

        try {
            setSubmitting(true);

            const response = await axios.put(
                route("hardware.update", hardware.id || hardware.hostname),
                { ...formattedValues, employee_id: emp_data?.emp_id },
            );

            if (response.data?.success) {
                toast.success(
                    response.data.message || "Hardware updated successfully",
                );

                if (onSave) {
                    const updatedHardwareData = {
                        hostname: formattedValues.hostname,
                        location: formattedValues.location || hardware.location,
                        remarks: formattedValues.remarks,
                        ...formattedValues,
                    };
                    onSave(updatedHardwareData);
                }

                setRemovedItems({ parts: [], software: [] });
                handleClose();
            } else {
                toast.error(
                    response.data?.message || "Failed to update hardware",
                );
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while updating hardware");
        } finally {
            setSubmitting(false);
        }
    };

    // ======================================
    // Close handler
    // ======================================
    const handleClose = () => {
        form.reset();
        setHardware(null);
        setRemovedItems({ parts: [], software: [] });
        initialOptionsLoaded.current = {
            parts: false,
            software: false,
        };
        loadingPartsOptions.current = false;
        loadingSoftwareOptions.current = false;
        partsLoadAttempted.current = false;
        softwareLoadAttempted.current = false;
        onClose();
    };

    // ======================================
    // Loading skeleton
    // ======================================
    if (loading || !hardware) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Hardware Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-5 space-y-4">
                        {[0, 1, 2].map((row) => (
                            <div
                                key={row}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                {[0, 1, 2].map((col) => (
                                    <div key={col} className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Hardware Details</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <Tabs
                                value={activeTab}
                                onValueChange={handleTabChange}
                            >
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="specs">
                                        Hardware Specs
                                    </TabsTrigger>
                                    <TabsTrigger value="parts">
                                        Parts
                                    </TabsTrigger>
                                    <TabsTrigger value="software">
                                        Software
                                    </TabsTrigger>
                                </TabsList>

                                {/* Hardware Specs Tab */}
                                <TabsContent
                                    value="specs"
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            {
                                                label: "Hostname",
                                                name: "hostname",
                                            },
                                            { label: "Model", name: "model" },
                                            { label: "Brand", name: "brand" },
                                            { label: "Serial", name: "serial" },
                                            // {
                                            //     label: "Processor",
                                            //     name: "processor",
                                            // },
                                            // {
                                            //     label: "Motherboard",
                                            //     name: "motherboard",
                                            // },
                                            {
                                                label: "IP Address",
                                                name: "ip_address",
                                            },
                                            {
                                                label: "WiFi Mac Address",
                                                name: "wifi_mac",
                                            },
                                            {
                                                label: "LAN Mac",
                                                name: "lan_mac",
                                            },
                                        ].map((field) => (
                                            <FormField
                                                key={field.name}
                                                control={form.control}
                                                name={field.name}
                                                render={({
                                                    field: formField,
                                                }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {field.label}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...formField}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Parts Tab */}
                                <TabsContent
                                    value="parts"
                                    className="space-y-4"
                                >
                                    {partFields.map((field, index) => {
                                        // Use the exact field name format that the hooks expect
                                        const fieldName = `parts[${index}]`;
                                        const currentValues =
                                            form.watch(`parts.${index}`) || {};

                                        return (
                                            <div
                                                key={field.id}
                                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                                            >
                                                {/* Part Type */}
                                                <FormField
                                                    control={form.control}
                                                    name={`parts.${index}.part_type`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Part Type
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        partsOptions.types ||
                                                                        []
                                                                    }
                                                                    placeholder="Select Part Type"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `parts.${index}.brand`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.model`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.specifications`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.condition`,
                                                                            "",
                                                                        );

                                                                        // Load brands for this part type
                                                                        if (
                                                                            value
                                                                        ) {
                                                                            loadBrands(
                                                                                value,
                                                                                fieldName,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Brand */}
                                                <FormField
                                                    control={form.control}
                                                    name={`parts.${index}.brand`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Brand
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        partsOptions
                                                                            .brands[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select Brand"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `parts.${index}.model`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.specifications`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.condition`,
                                                                            "",
                                                                        );

                                                                        // Load models for this brand
                                                                        if (
                                                                            value &&
                                                                            currentValues.part_type
                                                                        ) {
                                                                            loadModels(
                                                                                currentValues.part_type,
                                                                                value,
                                                                                fieldName,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Model */}
                                                <FormField
                                                    control={form.control}
                                                    name={`parts.${index}.model`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Model
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        partsOptions
                                                                            .models[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select Model"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `parts.${index}.specifications`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.condition`,
                                                                            "",
                                                                        );

                                                                        // Load specifications for this model
                                                                        if (
                                                                            value &&
                                                                            currentValues.part_type &&
                                                                            currentValues.brand
                                                                        ) {
                                                                            loadSpecifications(
                                                                                currentValues.part_type,
                                                                                currentValues.brand,
                                                                                value,
                                                                                fieldName,
                                                                                index,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Specifications */}
                                                <FormField
                                                    control={form.control}
                                                    name={`parts.${index}.specifications`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Specifications
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        partsOptions
                                                                            .specifications[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select Specifications"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        // Parse the JSON value to extract condition
                                                                        let conditionValue =
                                                                            "";

                                                                        if (
                                                                            value
                                                                        ) {
                                                                            try {
                                                                                const parsed =
                                                                                    JSON.parse(
                                                                                        value,
                                                                                    );
                                                                                conditionValue =
                                                                                    parsed.condition ||
                                                                                    "";
                                                                            } catch (e) {
                                                                                // If not JSON, ignore
                                                                            }
                                                                        }

                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        form.setValue(
                                                                            `parts.${index}.condition`,
                                                                            conditionValue,
                                                                        );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {/* Serial Number */}
                                                <FormField
                                                    control={form.control}
                                                    name={`parts.${index}.serial_number`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Serial
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter serial number"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Hidden condition field */}
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `parts.${index}.condition`,
                                                    )}
                                                />

                                                {/* Hidden id field */}
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `parts.${index}.id`,
                                                    )}
                                                />

                                                {/* Remove button */}
                                                <div className="col-span-1 flex justify-center items-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            const row =
                                                                form.getValues(
                                                                    "parts",
                                                                )?.[index];
                                                            handleRemoveWithReason(
                                                                "parts",
                                                                index,
                                                                row,
                                                            );
                                                        }}
                                                    >
                                                        <CircleMinus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            appendPart({
                                                part_type: "",
                                                brand: "",
                                                model: "",
                                                specifications: "",
                                                condition: "",
                                                serial_number: "",
                                            });
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Part
                                    </Button>
                                </TabsContent>

                                {/* Software Tab */}
                                <TabsContent
                                    value="software"
                                    className="space-y-4"
                                >
                                    {softwareFields.map((field, index) => {
                                        // Use the exact field name format that the hooks expect
                                        const fieldName = `software[${index}]`;
                                        const currentValues =
                                            form.watch(`software.${index}`) ||
                                            {};

                                        return (
                                            <div
                                                key={field.id}
                                                className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end"
                                            >
                                                {/* Software Name */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Name
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        softwareOptions.names ||
                                                                        []
                                                                    }
                                                                    placeholder="Select Name"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `software.${index}.type`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}.version`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}.license_key`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}._license_identifier`,
                                                                            "",
                                                                        );

                                                                        // Load types for this software name
                                                                        if (
                                                                            value
                                                                        ) {
                                                                            loadSoftwareTypes(
                                                                                value,
                                                                                fieldName,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Software Type */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.type`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Type
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        softwareOptions
                                                                            .types[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select Type"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `software.${index}.version`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}.license_key`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}._license_identifier`,
                                                                            "",
                                                                        );

                                                                        // Load versions for this type
                                                                        if (
                                                                            value &&
                                                                            currentValues.name
                                                                        ) {
                                                                            loadSoftwareVersions(
                                                                                currentValues.name,
                                                                                value,
                                                                                fieldName,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Version */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.version`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Version
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        softwareOptions
                                                                            .versions[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select Version"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );
                                                                        // Reset dependent fields
                                                                        form.setValue(
                                                                            `software.${index}.license_key`,
                                                                            "",
                                                                        );
                                                                        form.setValue(
                                                                            `software.${index}._license_identifier`,
                                                                            "",
                                                                        );

                                                                        // Load licenses for this version
                                                                        if (
                                                                            value &&
                                                                            currentValues.name &&
                                                                            currentValues.type
                                                                        ) {
                                                                            loadSoftwareLicenses(
                                                                                currentValues.name,
                                                                                currentValues.type,
                                                                                value,
                                                                                fieldName,
                                                                                index,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* License/Account */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.license_key`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    License/Account
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Combobox
                                                                    options={
                                                                        softwareOptions
                                                                            .licenses?.[
                                                                            fieldName
                                                                        ] || []
                                                                    }
                                                                    placeholder="Select License"
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) => {
                                                                        field.onChange(
                                                                            value,
                                                                        );

                                                                        const licenseOptions =
                                                                            softwareOptions
                                                                                .licenses?.[
                                                                                fieldName
                                                                            ] ||
                                                                            [];
                                                                        const selectedOption =
                                                                            licenseOptions.find(
                                                                                (
                                                                                    opt,
                                                                                ) =>
                                                                                    opt.value ===
                                                                                    value,
                                                                            );
                                                                        const licenseData =
                                                                            selectedOption?.license_data;

                                                                        if (
                                                                            licenseData
                                                                        ) {
                                                                            form.setValue(
                                                                                `software.${index}._license_identifier`,
                                                                                value,
                                                                            );
                                                                            form.setValue(
                                                                                `software.${index}.account_user`,
                                                                                licenseData.account_user ||
                                                                                    null,
                                                                            );
                                                                            form.setValue(
                                                                                `software.${index}.account_password`,
                                                                                licenseData.account_password ||
                                                                                    null,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Expiration Date (disabled) */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.expiration_date`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Expiration
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Input
                                                                    disabled
                                                                    placeholder="Expiration Date"
                                                                    {...field}
                                                                    value={
                                                                        field.value ||
                                                                        ""
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Qty (disabled) */}
                                                <FormField
                                                    control={form.control}
                                                    name={`software.${index}.qty`}
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-1">
                                                            {index === 0 && (
                                                                <FormLabel>
                                                                    Qty
                                                                </FormLabel>
                                                            )}
                                                            <FormControl>
                                                                <Input
                                                                    disabled
                                                                    placeholder="Qty"
                                                                    {...field}
                                                                    value={
                                                                        field.value ||
                                                                        ""
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Hidden fields */}
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `software.${index}.id`,
                                                    )}
                                                />
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `software.${index}._license_identifier`,
                                                    )}
                                                />
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `software.${index}.account_user`,
                                                    )}
                                                />
                                                <input
                                                    type="hidden"
                                                    {...form.register(
                                                        `software.${index}.account_password`,
                                                    )}
                                                />

                                                {/* Remove button */}
                                                <div className="col-span-1 flex justify-center items-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            const row =
                                                                form.getValues(
                                                                    "software",
                                                                )?.[index];
                                                            handleRemoveWithReason(
                                                                "software",
                                                                index,
                                                                row,
                                                            );
                                                        }}
                                                    >
                                                        <CircleMinus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                            appendSoftware({
                                                name: "",
                                                type: "",
                                                version: "",
                                                license_key: "",
                                                _license_identifier: "",
                                                account_user: null,
                                                account_password: null,
                                                expiration_date: "",
                                                qty: "",
                                            })
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Software
                                    </Button>
                                </TabsContent>
                            </Tabs>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <RemovalReasonModal
                visible={removalModalVisible}
                onConfirm={confirmRemoval}
                onCancel={cancelRemoval}
                form={removalForm}
                itemType={pendingRemoval?.fieldDataIndex}
            />
        </>
    );
};

export default HardwareModal;
