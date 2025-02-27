"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MultiSelectCheckbox({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleUnselect = (item) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item) => {
    console.log("Selecting item:", item);
    if (selected.includes(item)) {
      const newSelected = selected.filter((i) => i !== item);
      console.log("Removing item, new selection:", newSelected);
      onChange(newSelected);
    } else {
      const newSelected = [...selected, item];
      console.log("Adding item, new selection:", newSelected);
      onChange(newSelected);
    }
  };

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between h-auto min-h-10 ${
            selected.length > 0 ? "h-auto" : ""
          } ${className}`}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((item) => {
                const option = options.find((o) => o.value === item);
                return (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
                  >
                    {option?.label || item}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="opacity-50 ml-2">▼</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 border rounded-md mb-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="max-h-64 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => handleSelect(option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelect(option.value)}
                      className="mr-2 h-4 w-4 cursor-pointer"
                    />
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-gray-500 ml-2">
                        {option.description}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
