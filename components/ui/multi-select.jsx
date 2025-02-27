"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/**
 * Multi-select component based on Command and Popover
 * Allows selecting multiple items from a dropdown
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  ...props
}) {
  const [open, setOpen] = React.useState(false);

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
    // Keep the popover open after selection
    setTimeout(() => setOpen(true), 0);
  };

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
                      onClick={() => handleUnselect(item)}
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
      <PopoverContent className="w-full p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}`} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isSelected ? "bg-accent" : ""
                  }`}
                >
                  <div
                    className={`border border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                  >
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
