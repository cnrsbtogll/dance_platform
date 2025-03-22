import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatDialog } from './ChatDialog';
import { Spinner } from '../../../common/components/ui/Spinner';

interface UserData extends DocumentData {
  displayName?: string;
  role?: string | string[];
  photoURL?: string;
}

interface Chat {
  partnerId: string;
  partnerName: string;
  partnerRole: 'student' | 'instructor' | 'school' | 'partner';
  partnerPhotoURL?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

export const ChatList: React.FC = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    displayName: string;
    photoURL?: string;
    role?: 'student' | 'instructor' | 'school' | 'partner';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      console.log('Kullanıcı bulunamadı:', currentUser);
      return;
    }

    console.log('Mevcut kullanıcı:', currentUser.uid);

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Toplam mesaj sayısı:', snapshot.docs.length);
      console.log('Ham mesaj verileri:', snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

      const chatMap = new Map<string, Chat>();
      const processedPartners = new Set<string>();

      for (const docSnap of snapshot.docs) {
        const message = docSnap.data();
        const partnerId = message.senderId === currentUser.uid ? message.receiverId : message.senderId;
        
        console.log('İşlenen mesaj:', {
          messageId: docSnap.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          timestamp: message.timestamp
        });

        if (!processedPartners.has(partnerId)) {
          processedPartners.add(partnerId);
          
          try {
            // Partner bilgilerini direkt döküman ID'si ile al
            const userDocRef = doc(db, 'users', partnerId);
            const userDocSnap = await getDoc(userDocRef);
            
            console.log('Partner bilgileri:', {
              partnerId,
              exists: userDocSnap.exists(),
              userData: userDocSnap.data()
            });
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserData;
              const userRole = Array.isArray(userData.role) ? userData.role[0] : userData.role;
              const validRole = (role?: string): role is Chat['partnerRole'] => {
                return role === 'student' || role === 'instructor' || role === 'school' || role === 'partner';
              };

              chatMap.set(partnerId, {
                partnerId,
                partnerName: userData.displayName || 'İsimsiz Kullanıcı',
                partnerRole: validRole(userRole) ? userRole : 'student',
                partnerPhotoURL: userData.photoURL || '/assets/images/default-avatar.png',
                lastMessage: message.content,
                timestamp: message.timestamp?.toDate() || new Date(),
                unreadCount: message.senderId !== currentUser.uid && !message.read ? 1 : 0
              });

              // Okunmamış mesaj sayısını hesapla
              const unreadMessages = snapshot.docs.filter(msgDoc => {
                const msgData = msgDoc.data();
                // Gönderen partner ise ve mesaj okunmamışsa
                if (msgData.senderId === partnerId && !msgData.read) {
                  // Bu mesaja cevap verilip verilmediğini kontrol et
                  const hasReply = snapshot.docs.some(replyDoc => {
                    const replyData = replyDoc.data();
                    return replyData.senderId === currentUser.uid && 
                           replyData.timestamp > msgData.timestamp;
                  });
                  // Mesaj okunmamış VE cevap verilmemişse sayaca ekle
                  return !hasReply;
                }
                return false;
              });

              if (chatMap.has(partnerId)) {
                const chat = chatMap.get(partnerId)!;
                chat.unreadCount = unreadMessages.length;
                console.log('Sohbet güncellendi:', {
                  partnerId,
                  unreadCount: chat.unreadCount,
                  partnerName: chat.partnerName
                });
              }
            } else {
              console.warn('Partner kullanıcı dökümanı bulunamadı:', partnerId);
            }
          } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
          }
        }
      }

      const sortedChats = Array.from(chatMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      console.log('İşlenmiş sohbet listesi:', sortedChats);
      
      setChats(sortedChats);
      setLoading(false);
    }, (error) => {
      console.error('Mesajları dinlerken hata:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getRoleLabel = (role: Chat['partnerRole']) => {
    switch (role) {
      case 'student':
        return 'Öğrenci';
      case 'instructor':
        return 'Eğitmen';
      case 'school':
        return 'Dans Okulu';
      case 'partner':
        return 'Dans Partneri';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mesajlarım</h2>
        <span className="text-sm text-gray-500">
          {chats.length} sohbet
        </span>
      </div>
      
      <div className="bg-white rounded-lg shadow divide-y">
        {chats.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>Henüz hiç mesajınız bulunmuyor.</p>
            <p className="text-sm mt-2">Öğrencilerinizle iletişime geçerek sohbetlere başlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((chat) => (
              <div
                key={chat.partnerId}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => setSelectedChat({
                  id: chat.partnerId,
                  displayName: chat.partnerName,
                  photoURL: chat.partnerPhotoURL,
                  role: chat.partnerRole
                })}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={chat.partnerPhotoURL || '/assets/images/default-avatar.png'}
                      alt={chat.partnerName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/default-avatar.png';
                      }}
                    />
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{chat.partnerName}</h3>
                        <p className="text-sm text-gray-600">{getRoleLabel(chat.partnerRole)}</p>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {chat.timestamp.toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatDialog
          open={true}
          onClose={() => setSelectedChat(null)}
          partner={selectedChat}
        />
      )}
    </div>
  );
}; 