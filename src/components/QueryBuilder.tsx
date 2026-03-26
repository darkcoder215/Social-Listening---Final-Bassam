import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export type FilterType = 'company' | 'city' | 'jobTitle' | 'gender' | 'citizenship' | 'skills' | 'education' | 'experience';
export type Operator = 'is' | 'is_not' | 'contains' | 'not_contains';
export type LogicalOperator = 'AND' | 'OR';

export interface Condition {
  id: string;
  filterType: FilterType;
  operator: Operator;
  value: string;
  logicalOperator?: LogicalOperator;
}

interface QueryBuilderProps {
  conditions: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
  availableValues: {
    companies: string[];
    cities: string[];
    jobTitles: string[];
    skills: string[];
    education: string[];
    experience: string[];
  };
}

const filterTypeLabels: Record<FilterType, string> = {
  company: 'Company',
  city: 'City',
  jobTitle: 'Job Title',
  gender: 'Gender',
  citizenship: 'Citizenship',
  skills: 'Skills',
  education: 'Education',
  experience: 'Experience'
};

const operatorLabels: Record<Operator, string> = {
  is: 'is',
  is_not: 'is not',
  contains: 'contains',
  not_contains: 'does not contain'
};

export function QueryBuilder({ conditions, onConditionsChange, availableValues }: QueryBuilderProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      id: Math.random().toString(36).substr(2, 9),
      filterType: 'company',
      operator: 'is',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined
    };
    onConditionsChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    const newConditions = conditions.filter(c => c.id !== id);
    // Remove logicalOperator from last condition
    if (newConditions.length > 0) {
      newConditions[newConditions.length - 1].logicalOperator = undefined;
    }
    onConditionsChange(newConditions);
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    onConditionsChange(
      conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const getPreviewText = () => {
    if (conditions.length === 0) {
      return "No conditions set. Add a condition to begin.";
    }

    const parts = conditions.map((condition, index) => {
      const filterLabel = filterTypeLabels[condition.filterType];
      const operatorLabel = operatorLabels[condition.operator];
      const value = condition.value || "___";
      
      let text = `${filterLabel} ${operatorLabel} "${value}"`;
      
      if (condition.logicalOperator && index < conditions.length - 1) {
        text += ` ${condition.logicalOperator}`;
      }
      
      return text;
    });

    return parts.join(' ');
  };

  const getAvailableValuesForType = (filterType: FilterType): string[] => {
    switch (filterType) {
      case 'company':
        return availableValues.companies;
      case 'city':
        return availableValues.cities;
      case 'jobTitle':
        return availableValues.jobTitles;
      case 'skills':
        return availableValues.skills;
      case 'education':
        return availableValues.education;
      case 'experience':
        return availableValues.experience;
      case 'gender':
        return ['Male', 'Female', 'Unspecified'];
      case 'citizenship':
        return ['Saudi', 'Non-Saudi', 'Unspecified'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        Show records where:
      </div>

      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex items-center gap-2">
            {/* Logical Operator - show before condition (except first) */}
            {index > 0 && (
              <Select
                value={conditions[index - 1].logicalOperator || 'AND'}
                onValueChange={(value) => updateCondition(conditions[index - 1].id, { logicalOperator: value as LogicalOperator })}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Filter Type */}
            <Select
              value={condition.filterType}
              onValueChange={(value) => updateCondition(condition.id, { 
                filterType: value as FilterType,
                value: '' // Reset value when filter type changes
              })}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(filterTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select
              value={condition.operator}
              onValueChange={(value) => updateCondition(condition.id, { operator: value as Operator })}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operatorLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value */}
            <div className="flex-1">
              {getAvailableValuesForType(condition.filterType).length > 0 ? (
                <Select
                  value={condition.value}
                  onValueChange={(value) => updateCondition(condition.id, { value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Enter value..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableValuesForType(condition.filterType).map((val) => (
                      <SelectItem key={val} value={val}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter value..."
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                  className="h-9"
                />
              )}
            </div>

            {/* Delete Button */}
            <Button
              onClick={() => removeCondition(condition.id)}
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <Button onClick={addCondition} size="sm" variant="ghost" className="text-muted-foreground">
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>

      {/* Preview Summary */}
      {conditions.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          {getPreviewText()}
          {conditions.some(c => !c.value) && (
            <span className="text-orange-500 ml-2">⚠️ Some conditions need a value</span>
          )}
        </div>
      )}
    </div>
  );
}
