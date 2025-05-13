"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// TODO: Replace MOCK_LOCATIONS with Google Places API integration
// This will require:
// 1. Setting up a Google Cloud Project and enabling the Places API.
// 2. Obtaining an API key.
// 3. Implementing a server-side function/API route to securely call the Google Places API
//    to prevent exposing the API key on the client-side.
// 4. Updating `handleInputChange` to fetch suggestions from that server-side endpoint.
const MOCK_LOCATIONS = [
  "New York, NY, USA", "Los Angeles, CA, USA", "Chicago, IL, USA", "Houston, TX, USA", "Phoenix, AZ, USA",
  "Philadelphia, PA, USA", "San Antonio, TX, USA", "San Diego, CA, USA", "Dallas, TX, USA", "San Jose, CA, USA",
  "Austin, TX, USA", "Jacksonville, FL, USA", "Fort Worth, TX, USA", "Columbus, OH, USA", "Charlotte, NC, USA",
  "San Francisco, CA, USA", "Indianapolis, IN, USA", "Seattle, WA, USA", "Denver, CO, USA", "Washington, DC, USA",
  "Boston, MA, USA", "Nashville, TN, USA", "Kolkata, West Bengal, India", "Mumbai, Maharashtra, India", "Delhi, NCT, India",
  "Bangalore, Karnataka, India", "Chennai, Tamil Nadu, India", "Hyderabad, Telangana, India",
  "London, UK", "Paris, France", "Berlin, Germany", "Toronto, ON, Canada", "Sydney, NSW, Australia", "Tokyo, Japan"
];

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = "Enter location...",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value); 
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    onChange(query); 

    if (query.length > 1) {
      // In a real implementation, this is where you would call your server-side endpoint
      // which in turn calls the Google Places API.
      // For now, we filter the mock list.
      const filteredSuggestions = MOCK_LOCATIONS.filter(location =>
        location.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5)); 
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        autoComplete="off" // Important to disable browser's own autocomplete
      />
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 border bg-background shadow-lg max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationAutocompleteInput;
