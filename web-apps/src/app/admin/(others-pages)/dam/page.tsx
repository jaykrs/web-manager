import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import { appName } from "@/utils/config";
import React from "react";
import MediaLibrary from "@/components/MediaLibrary/MediaLibrary";

export const metadata: Metadata = {
  title: ` Digital Assets | ${appName}`,
  description:
    `${appName} Digital Assets `,
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Digital Assets" />
      <MediaLibrary />
    </div>
  );
}