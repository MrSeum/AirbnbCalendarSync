import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate, getTimeAgo } from '@/lib/utils';
import { Property } from '@shared/schema';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PropertiesListProps {
  limit?: number;
  onManageAll?: () => void;
  onEdit?: (property: Property) => void;
}

const PropertiesList: React.FC<PropertiesListProps> = ({
  limit,
  onManageAll,
  onEdit
}) => {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const displayProperties = limit ? properties?.slice(0, limit) : properties;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(limit || 3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-gray-500 mb-4">Add your first property to get started</p>
            <a 
              href="/add-property" 
              className="bg-[#3B68B5] hover:bg-[#2A4F8F] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Property
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#484848]">Your Properties</h2>
        {onManageAll && (
          <button 
            onClick={onManageAll}
            className="text-[#00A699] text-sm font-medium"
          >
            Manage All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayProperties?.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 relative" style={{ backgroundColor: property.color }}>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <h3 className="text-white font-semibold">{property.name}</h3>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-medium" style={{ color: property.color }}>
                  Last sync: {property.lastSync ? getTimeAgo(property.lastSync) : 'Never'}
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-[#767676]">Next checkout:</span>
                <span className="font-medium">Coming soon</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {property.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <button 
                  onClick={() => onEdit && onEdit(property)}
                  className="text-sm text-[#00A699] font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertiesList;
