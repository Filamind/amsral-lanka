import { useState } from 'react';
import PrimaryButton from '../components/common/PrimaryButton';
import colors from '../styles/colors';
import ItemsSection from '../components/systemData/ItemsSection';
import WashingTypesSection from '../components/systemData/WashingTypesSection';
import MachinesSection from '../components/systemData/MachinesSection';
import ProcessTypesSection from '../components/systemData/ProcessTypesSection';


type SystemDataSection = 'items' | 'washingTypes' | 'machines' | 'processTypes';

const navigationButtons = [
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'washingTypes', label: 'Washing Types', icon: '🧺' },
    { id: 'machines', label: 'Machines', icon: '⚙️' },
    { id: 'processTypes', label: 'Process Types', icon: '🔄' },
] as const;

export default function SystemDataPage() {
    const [activeSection, setActiveSection] = useState<SystemDataSection>('items');

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'items':
                return <ItemsSection />;
            case 'washingTypes':
                return <WashingTypesSection />;
            case 'machines':
                return <MachinesSection />;
            case 'processTypes':
                return <ProcessTypesSection />;
            default:
                return <ItemsSection />;
        }
    };

    return (
        <div className="w-full mx-auto px-1 sm:px-3 md:px-4 py-3">
            <div className="flex flex-col gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                    System Data Management
                </h2>

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {navigationButtons.map((button) => (
                        <PrimaryButton
                            key={button.id}
                            onClick={() => setActiveSection(button.id)}
                            style={{
                                minWidth: 140,
                                background: activeSection === button.id ? colors.primary[500] : colors.primary[100],
                                color: activeSection === button.id ? 'white' : colors.text.primary,
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontWeight: activeSection === button.id ? '600' : '500',
                            }}
                        >
                            <span className="mr-2">{button.icon}</span>
                            {button.label}
                        </PrimaryButton>
                    ))}
                </div>
            </div>

            {/* Active Section Content */}
            <div className="mt-1">
                {renderActiveSection()}
            </div>
        </div>
    );
}
