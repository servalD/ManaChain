"use client";

import { useState } from "react";
import { Search, Ban, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import PinataService from "@/services/pinata.service";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  country: string;
  created_at: string;
}

// Mock brands data
const mockBrands: Brand[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Nike",
    logo_url: "/Logo_NIKE.svg",
    website_url: "https://nike.com",
    country: "USA",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Adidas",
    logo_url: "/Adidas_Logo.svg",
    website_url: "https://adidas.com",
    country: "Germany",
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "LVMH",
    logo_url: "/LVMH_wordmark.svg",
    website_url: "https://lvmh.com",
    country: "France",
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "BMW",
    logo_url: "/BMW_logo_(gray).svg",
    website_url: "https://bmw.com",
    country: "Germany",
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    name: "Apple",
    logo_url: null,
    website_url: "https://apple.com",
    country: "USA",
    created_at: "2024-02-15T10:00:00Z",
  },
];

export function ActiveBrandsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const [brands] = useState<Brand[]>(mockBrands);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedBrands = filteredBrands.slice(0, limit);

  const handleBan = (brandId: string) => {
    // TODO: Implement ban functionality
    console.log("Ban brand:", brandId);
  };

  return (
    <div className="space-y-4 pt-8">
      <div>
        <h2 className="text-xl font-bold">Active Brands</h2>
        <p className="text-sm text-muted-foreground">
          {filteredBrands.length} {filteredBrands.length === 1 ? "brand" : "brands"} found
        </p>
      </div>

      {/* Search and Limit Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select 
          value={limit.toString()} 
          onValueChange={(value) => setLimit(Number(value))} 
          className="w-32"
        >
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Brand</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">ID</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Country</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Created</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedBrands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No brands found
                  </td>
                </tr>
              ) : (
                displayedBrands.map((brand, index) => (
                  <tr
                    key={brand.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === displayedBrands.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {brand.logo_url ? (
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                            <img
                              src={PinataService.normalizeIpfsUrl(brand.logo_url)}
                              alt={brand.name}
                              className="w-full h-full object-contain"
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  target.style.display = 'none';
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                  placeholder.textContent = brand.name.charAt(0);
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-400">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{brand.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground font-mono">
                        {brand.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">{brand.country}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(brand.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleBan(brand.id)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <MoreHorizontal className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
