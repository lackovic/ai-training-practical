import React, { Suspense, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Home, List, Car, PieChart, Zap } from "lucide-react";

import Wrapper from "../components/Wrapper";
import Sidebar from "../components/sidebar/Sidebar";
import Main from "../components/Main";
import Content from "../components/Content";
import Loader from "../components/Loader";
import { SidebarItemsType } from "../types/sidebar";

interface DashboardProps {
  children?: ReactNode;
}

const sidebarNavigation: { title: string; pages: SidebarItemsType[] }[] = [
  {
    title: "",
    pages: [
      {
        href: "/",
        icon: Home,
        title: "Start Here",
      },
      {
        href: "/exercises/tasks/list",
        title: "Task List",
        icon: List,
      },
      {
        href: "/exercises/parking",
        title: "Car Park Availability",
        icon: Car,
      },
      {
        href: "/exercises/analytics-chart",
        title: "Analytics Chart",
        icon: PieChart,
      },
      {
        href: "/exercises/stretch",
        title: "Stretch Exercise",
        icon: Zap,
      },
    ],
  },
];

const Dashboard: React.FC<DashboardProps> = ({ children }) => (
  <React.Fragment>
    <Wrapper>
      <Sidebar items={sidebarNavigation} />
      <Main>
        <Content>
          <Suspense fallback={<Loader />}>
            {children}
            <Outlet />
          </Suspense>
        </Content>
      </Main>
    </Wrapper>
  </React.Fragment>
);

export default Dashboard;
