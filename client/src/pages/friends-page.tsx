
import MainLayout from "@/components/main-layout";
import FriendList from "@/components/friend-list";

export default function FriendsPage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4">
        <FriendList />
      </div>
    </MainLayout>
  );
}
