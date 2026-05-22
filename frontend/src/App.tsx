import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import MyOrders from "@/pages/MyOrders";
import MyTickets from "@/pages/MyTickets";
import Profile from "@/pages/Profile";
import PaymentCallback from "@/pages/PaymentCallback";
import OrganizerDashboard from "@/pages/organizer/Dashboard";
import MyEvents from "@/pages/organizer/MyEvents";
import EventForm from "@/pages/organizer/EventForm";
import TicketsManager from "@/pages/organizer/TicketsManager";
import TicketScanner from "@/pages/organizer/TicketScanner";
import AdminDashboard from "@/pages/admin/Dashboard";
import AllOrders from "@/pages/admin/AllOrders";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />

        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="payment/callback" element={<PaymentCallback />} />

        <Route
          path="organizer"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/events"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <MyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/events/new"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/events/:id/edit"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/events/:id/tickets"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <TicketsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer/scan"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <TicketScanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/orders"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AllOrders />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/events" replace />} />
      </Route>
    </Routes>
  );
}
