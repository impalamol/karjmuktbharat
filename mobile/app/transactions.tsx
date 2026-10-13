import { useMemo } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { StackHeader } from '@/components/StackHeader'
import { ListRow } from '@/components/ListRow'
import { Empty, ErrorView, Loading, SkeletonBlock } from '@/components/States'
import { useTransactions } from '@/lib/api'
import { txnRow } from '@/lib/txn'

const ROW_HEIGHT = 72

/** Virtualised, keyset-paginated history: only visible rows render, pages load on scroll. */
export default function Transactions() {
  const q = useTransactions()
  const rows = useMemo(() => q.data?.pages.flat() ?? [], [q.data])

  return (
    <Screen scroll={false} bottomInset={false}>
      <StackHeader title="Transactions" />
      {q.isError ? (
        <ErrorView error={q.error} onRetry={() => q.refetch()} />
      ) : q.isLoading ? (
        <View className="gap-3">{[0, 1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-14" />)}</View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(t) => t.id}
          renderItem={({ item, index }) => <ListRow {...txnRow(item)} index={index % 20} />}
          getItemLayout={(_, i) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * i, index: i })}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          initialNumToRender={12}
          maxToRenderPerBatch={20}
          windowSize={7}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => q.refetch()} />}
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : <View className="h-10" />}
          ListEmptyComponent={<Empty title="No transactions yet" body="Your first Karj Mukti credit will show here." />}
          showsVerticalScrollIndicator={false}
          className="-mx-5 px-5"
        />
      )}
    </Screen>
  )
}
