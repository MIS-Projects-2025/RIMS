import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { Package, Layers } from "lucide-react";

import { useRequestCart } from "@/Hooks/useRequestCart";
import RequestPicker from "@/Components/request/RequestPicker";
import Cart from "@/Components/request/Cart";
import Summary from "@/Components/request/Summary";
import RequestDrawer from "@/Components/request/RequestDrawer";
import BulkRequestDrawer from "@/Components/request/BulkRequestDrawer";
import { ToggleGroup, ToggleGroupItem } from "@/Components/ui/toggle-group";

const Form = () => {
    const { emp_data } = usePage().props;
    const [requestMode, setRequestMode] = useState("per-item");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestTypes, setRequestTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [locationLists, setLocationLists] = useState([]);

    useEffect(() => {
        const fetchRequestTypes = async () => {
            try {
                const res = await axios.get(route("request-types.list"));
                setRequestTypes(res.data);
            } catch (err) {
                console.error("Error fetching request types:", err);
            }
        };
        fetchRequestTypes();

        const fetchEmployees = async (emp_id) => {
            try {
                const res = await axios.get(route("staff.list", emp_id));
                setEmployees(res.data.employees || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchEmployees(emp_data.emp_id);

        const fetchLocationLists = async () => {
            try {
                const res = await axios.get(route("locations.list"));
                setLocationLists(
                    res.data.map((loc) => ({
                        label: loc.location_name,
                        value: loc.id,
                    })),
                );
            } catch (err) {
                console.error(err);
            }
        };
        fetchLocationLists();
    }, []);

    const { cart, addToCart, removeItem, updateItem } =
        useRequestCart(requestTypes);

    const handleAdd = () => {
        const added = addToCart(selectedRequest, requestMode);
        if (added) setSelectedRequest(null);
    };

    const openDrawer = (index) => {
        setActiveIndex(index);
        setDrawerOpen(true);
    };

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <AuthenticatedLayout>
            <div className="p-4 space-y-4">
                {/* Mode Toggle */}
                <ToggleGroup
                    type="single"
                    value={requestMode}
                    onValueChange={(val) => val && setRequestMode(val)}
                    className="justify-start"
                >
                    <ToggleGroupItem value="per-item" className="gap-2">
                        <Package size={16} />
                        Per Item
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bulk" className="gap-2">
                        <Layers size={16} />
                        Bulk
                    </ToggleGroupItem>
                </ToggleGroup>

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8 space-y-4">
                        <RequestPicker
                            catalog={requestTypes}
                            selectedRequest={selectedRequest}
                            setSelectedRequest={setSelectedRequest}
                            onAdd={handleAdd}
                            mode={requestMode}
                        />
                        <Cart
                            cart={cart}
                            onEdit={openDrawer}
                            onRemove={removeItem}
                        />
                    </div>
                    <div className="col-span-4">
                        <Summary cart={cart} />
                    </div>
                </div>
            </div>

            {/* Drawers */}
            {activeIndex !== null && (
                <>
                    {cart[activeIndex]?.mode === "bulk" ? (
                        <BulkRequestDrawer
                            open={drawerOpen}
                            onClose={closeDrawer}
                            item={cart[activeIndex]}
                            onSave={(data) => updateItem(activeIndex, data)}
                            employees={employees}
                            locations={locationLists}
                        />
                    ) : (
                        <RequestDrawer
                            open={drawerOpen}
                            onClose={closeDrawer}
                            item={cart[activeIndex]}
                            onSave={(data) => updateItem(activeIndex, data)}
                            employees={employees}
                            locations={locationLists}
                        />
                    )}
                </>
            )}
        </AuthenticatedLayout>
    );
};

export default Form;
