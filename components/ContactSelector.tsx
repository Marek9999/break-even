"use client";

import { useSplit, Friend } from "@/lib/split-context";
import { useSettings } from "@/lib/settings-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, ArrowRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export function ContactSelector() {
  const { 
    selectedFriends, 
    toggleFriend, 
    setCurrentStep, 
    allFriends, 
    isLoading,
    includeSelf,
    setIncludeSelf,
    currentUser,
  } = useSplit();
  const { openFriendForm } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return allFriends;

    const query = searchQuery.toLowerCase();
    return allFriends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) ||
        friend.email.toLowerCase().includes(query)
    );
  }, [allFriends, searchQuery]);

  const isSelected = (friend: Friend) =>
    selectedFriends.some((f) => f._id === friend._id);

  const handleContinue = () => {
    if (selectedFriends.length > 0) {
      setCurrentStep("method");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-600" />
            <h3 className="font-semibold text-stone-900">Select People to Split With</h3>
          </div>
        </div>
        <p className="text-sm text-stone-500">
          Choose who you want to split this transaction with
        </p>
      </div>

      {/* Include Myself Toggle */}
      {currentUser && (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-4 border ${
            includeSelf
              ? "bg-blue-50 border-blue-200"
              : "bg-stone-50 border-stone-200 hover:bg-stone-100"
          }`}
          onClick={() => setIncludeSelf(!includeSelf)}
        >
          <Checkbox
            checked={includeSelf}
            onCheckedChange={() => setIncludeSelf(!includeSelf)}
          />
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-500 text-white">
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900">Include myself</p>
            <p className="text-sm text-stone-500 truncate">You • {currentUser.email}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected count */}
      {selectedFriends.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-stone-600">
            {selectedFriends.length} selected
          </span>
          <div className="flex -space-x-2">
            {selectedFriends.slice(0, 5).map((friend) => (
              <Avatar key={friend._id} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className={`${friend.color} text-white text-xs`}>
                  {friend.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {selectedFriends.length > 5 && (
              <div className="h-6 w-6 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-stone-600">
                  +{selectedFriends.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friend List */}
      <div className="space-y-1">
        {allFriends.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No friends yet</p>
            <p className="text-xs mt-2">
              Add friends to split bills with them
            </p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p>No friends match your search</p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected(friend)
                  ? "bg-stone-100"
                  : "hover:bg-stone-50"
              }`}
              onClick={() => toggleFriend(friend)}
            >
              <Checkbox
                checked={isSelected(friend)}
                onCheckedChange={() => toggleFriend(friend)}
              />
              <Avatar className="h-10 w-10">
                <AvatarFallback className={`${friend.color} text-white`}>
                  {friend.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate">
                  {friend.name}
                </p>
                <p className="text-sm text-stone-500 truncate">{friend.email}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t mt-4">
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={selectedFriends.length === 0}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
