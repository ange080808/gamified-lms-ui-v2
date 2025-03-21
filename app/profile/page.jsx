"use client";

import { Suspense, useEffect, useRef, useState } from "react";
const Body = dynamic(() => import("@/components/body"), { ssr: false });
import Header from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Pencil, Star, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserById,
  fetchUsers,
  updateProfilePicture,
} from "@/lib/api/users";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/empty-state";

import notFound from "@/public/not-found.json";
import { toast } from "sonner";
import dynamic from "next/dynamic";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function ProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"));
    }
  }, []);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ userId, file }) => updateProfilePicture({ userId, file }),
    onSuccess: (updatedUser) => {
      toast.success("Profile picture updated!");
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      setSelectedImage(null); // Reset preview after upload
    },
    onError: () => toast.error("Failed to update profile picture."),
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file)); // Preview before upload
      uploadMutation.mutate({ userId, file }); // Upload immediately
    }
  };

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchUsers, // Fetch all users
    enabled: !!user, // Fetch only when user data is available
  });

  // ✅ Filter only students and sort by expPoints (highest first)
  const students =
    users
      ?.filter((u) => u.role === "Student")
      .sort((a, b) => b.expPoints - a.expPoints) || [];

  // ✅ Find the rank of the current user
  const studentRank = students.findIndex((s) => s.id === user?.id) + 1; // Add 1 to avoid zero-based index

  const lessonsTaken = user?.StudentLesson?.length || 0;
  const activitiesTaken = user?.StudentActivity?.length || 0;

  return (
    <Body>
      {/* Page Header with Breadcrumbs */}
      <Header
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        )}

        {isError && (
          <EmptyState animation={notFound} message="Failed to load profile." />
        )}

        {!isLoading && user && (
          <>
            {/* Profile Header */}
            <Card className="p-4 shadow-sm border rounded-lg">
              <div className="flex w-full justify-between items-center">
                {/* Left Section: Profile Image & User Details */}
                <div className="flex items-center gap-4 ">
                  <div className="relative">
                    {/* Profile Image */}
                    {user.profileUrl ? (
                      <img
                        src={`${API_URL}/uploads${user.profileUrl}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border"
                      />
                    ) : (
                      <img
                        src={
                          selectedImage ||
                          (user.gender === "Male"
                            ? "/profile-m.png"
                            : "/profile-w.png")
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border"
                      />
                    )}

                    {/* Upload Button */}
                    <button
                      className="absolute bottom-0 right-0 bg-gray-800 text-white p-1 rounded-full"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Upload size={16} />
                    </button>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* User Details */}
                  <div className="text-left">
                    <h2 className="text-xl font-semibold">
                      {user.firstName} {user.lastName}{" "}
                    </h2>
                    <p className="text-gray-600 text-sm">{user.username}</p>
                    {role === "Student" && (
                      <div className=" mt-2 flex items-center gap-1 text-yellow-500 font-semibold">
                        <Star size={18} />
                        <span className="text-lg">{user.expPoints}</span> Total
                        Points
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section: Rank & Leaderboard */}
                {role === "Student" && (
                  <div className="text-right">
                    {isUsersLoading ? (
                      <p className="text-gray-600 text-sm">Loading rank...</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-violet-900">
                          {studentRank}
                        </p>
                        <p className="text-gray-600 text-sm">#RANK</p>
                      </>
                    )}
                    <Button
                      className="mt-2 bg-primary text-white"
                      onClick={() => router.push("/leaderboard")}
                    >
                      View Leaderboard
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {
              role === "Student" && ""
              // <Card className="p-4">
              //   <h3 className="text-lg font-semibold mb-3">Achievements</h3>
              //   <div className="flex gap-4">
              //     {/* {user.badges.map((badge, index) => (
              //     <div key={index} className="flex flex-col items-center">
              //       <img
              //         src={badge.icon}
              //         alt={badge.name}
              //         className="w-16 h-16"
              //       />
              //       <p className="text-sm text-gray-600 mt-1">{badge.name}</p>
              //     </div>
              //   ))} */}
              //   </div>
              // </Card>
            }

            {/* Stats Section */}
            {role === "Student" && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Progress</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-gray-500 text-sm">Lessons Taken</p>
                    <p className="text-xl font-semibold">
                      {user.StudentLesson.length || 0}
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      Activities Completed
                    </p>
                    <p className="text-xl font-semibold">{activitiesTaken}</p>
                  </Card>
                </div>
              </Card>
            )}

            {/* Personal Information */}
            <Card className="p-4 relative">
              <h3 className="text-lg font-semibold mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <p className="text-gray-700">
                  <strong>First Name:</strong> {user.firstName}
                </p>

                {/* Middle Name */}
                <p className="text-gray-700">
                  <strong>Middle Name:</strong> {user.middleName || "---"}
                </p>

                {/* Last Name */}
                <p className="text-gray-700">
                  <strong>Last Name:</strong> {user.lastName || "---"}
                </p>

                {/* Username */}
                <p className="text-gray-700">
                  <strong>Username:</strong> {user.username}
                </p>

                {/* Role */}
                <p className="text-gray-700">
                  <strong>Role:</strong> {user.role}
                </p>

                {/* Age */}
                <p className="text-gray-700">
                  <strong>Age:</strong> {user.age}
                </p>

                {/* Gender */}
                <p className="text-gray-700">
                  <strong>Gender:</strong> {user.gender}
                </p>

                {/* Address */}
                <p className="text-gray-700 col-span-1 sm:col-span-2">
                  <strong>Address:</strong> {user.address || "---"}
                </p>

                {/* Email */}
                <p className="text-gray-700">
                  <strong>Email:</strong> {user.email || "---"}
                </p>

                {/* Unique ID */}
                <p className="text-gray-700">
                  <strong>Unique ID:</strong> {user.uniqueId}
                </p>

                {/* Teacher Name */}
                <p className="text-gray-700">
                  <strong>Teacher Name:</strong>{" "}
                  {user.teacher?.firstName || "---"}
                </p>
              </div>
              {/* Edit Button */}
              {/* <Button
                className="absolute top-3 right-3 bg-gray-200 text-gray-600 hover:bg-gray-300"
                onClick={() => {
                  const role = localStorage.getItem("role");
                  if (role === "Student") {
                    router.push(`/students/update?studentId=${userId}`);
                  } else {
                    router.push(`/teachers/update?teacherId=${userId}`);
                  }
                }}
              >
                <Pencil size={16} /> Edit
              </Button> */}
            </Card>
          </>
        )}
      </div>
    </Body>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
}
